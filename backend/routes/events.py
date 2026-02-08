from ai.embeddings import model, util, similarity
from supabase_client import supabaseDB
from fastapi import APIRouter
import torch

router = APIRouter(prefix="/events", tags=["events"])

@router.get("/test")
def test_connection():
    return {"status": "ok", "message": "Backend is reachable"}

@router.get("/recommended/{profile_id}")
def get_recommended_events(profile_id: str):
    # 1. Get user's tags
    profile_tags_resp = supabaseDB.table("profile_tags").select("*").eq("profile_id", profile_id).execute()
    p_tags_raw = profile_tags_resp.data
    
    if not p_tags_raw:
        print(f"DEBUG: No tags found for profile {profile_id}")
        return {"events": [], "message": "Profile has no tags."}
    
    profile_tags = [t["tag_name"] for t in p_tags_raw]
    print(f"DEBUG: Profile tags for {profile_id}: {profile_tags}")

    # 2. Get all events and their tags
    events_resp = supabaseDB.table("events").select("*").execute()
    events = events_resp.data
    print(f"DEBUG: Found {len(events)} total events")
    
    event_tags_resp = supabaseDB.table("event_tags").select("*").execute()
    event_tags_data = event_tags_resp.data
    
    event_to_tags = {}
    all_unique_event_tags = set()
    for et in event_tags_data:
        event_to_tags.setdefault(et["event_id"], []).append(et["tag_name"])
        all_unique_event_tags.add(et["tag_name"])
    
    event_tag_list = list(all_unique_event_tags)
    if not event_tag_list:
        return {"events": []}

    # 3. Batch Encode (Super fast compared to individual calls)
    try:
        profile_embeddings = model.encode(profile_tags, convert_to_tensor=True)
        event_tag_embeddings = model.encode(event_tag_list, convert_to_tensor=True)

        # Calculate cosine similarity matrix
        cosine_scores = util.cos_sim(profile_embeddings, event_tag_embeddings)
        print(f"DEBUG: Cosine scores matrix calculated. Shape: {cosine_scores.shape}")
        
        # Map tag similarity scores for easy lookup
        tag_sim_map = {}
        for i, p_tag in enumerate(profile_tags):
            for j, e_tag in enumerate(event_tag_list):
                score = cosine_scores[i][j].item()
                tag_sim_map[(p_tag, e_tag)] = score
                if score >= 0.4:
                    print(f"DEBUG: Match found: {p_tag} <-> {e_tag} = {score:.4f}")
    except Exception as e:
        print(f"Embedding error: {e}")
        return {"events": [], "error": str(e)}

    # 4. Score events
    recommended = []
    threshold = 0.4 # Threshold for a "match"

    for event in events:
        e_tags = event_to_tags.get(event["id"], [])
        if not e_tags:
            continue
            
        total_score = 0
        matches = 0
        
        for p_tag in profile_tags:
            # Find the best matching tag for this profile tag in the event
            best_match_for_p_tag = 0
            for e_tag in e_tags:
                sim = tag_sim_map.get((p_tag, e_tag), 0)
                if sim > best_match_for_p_tag:
                    best_match_for_p_tag = sim
            
            if best_match_for_p_tag >= threshold:
                total_score += best_match_for_p_tag
                matches += 1
        
        if matches > 0:
            event_copy = event.copy()
            # Score is the average similarity of the matching tags
            event_copy["score"] = total_score / matches
            event_copy["tags"] = e_tags
            recommended.append(event_copy)
    
    # Sort by score descending
    recommended.sort(key=lambda x: x["score"], reverse=True)
    return {"events": recommended[:10]}

@router.post("/{event_id}/register/{profile_id}")
def register_for_event(event_id: int, profile_id: str):

    BOOST = 0.15
    DECAY = 0.05
    SIM_THRESHOLD = 0.5
    MAX_WEIGHT = 3.0
    MIN_WEIGHT = 0.1

    profile_tags = supabaseDB.table("profile_tags") \
        .select("tag_name, weight") \
        .eq("profile_id", profile_id) \
        .execute().data
    
    event_tags = supabaseDB.table("event_tags") \
        .select("tag_name") \
        .eq("event_id", event_id) \
        .execute().data

    if not profile_tags or not event_tags:
        return {"status": "no-op"}

    for p in profile_tags:
     #compute similarities
        list_sim = [similarity(p["tag_name"], e["tag_name"]) for e in event_tags]
        list_sim.sort(reverse=True)

        local_boost = BOOST
        local_decay = DECAY

        for sim in list_sim:
            if sim >= SIM_THRESHOLD:
                p["weight"] = min(MAX_WEIGHT, p["weight"] + local_boost * sim)
                local_boost *= 0.9
            else:
                p["weight"] = max(MIN_WEIGHT, p["weight"] - local_decay * (1 - sim))
                local_decay *= 1.1

        #print(f"Updated weight for tag '{p['tag_name']}': {p['weight']:.4f}")
        #update DB for this profile tag
        supabaseDB.table("profile_tags") \
           .update({"weight": p["weight"]}) \
            .eq("profile_id", profile_id) \
            .eq("tag_name", p["tag_name"]) \
            .execute()

    return {"status": "updated"}
