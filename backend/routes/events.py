from ai.embeddings import similarity
from supabase_client import supabaseDB
from fastapi import APIRouter
import requests

router = APIRouter(prefix="/events", tags=["events"])

@router.get("/recommended/{profile_id}")
def get_recommended_events(profile_id: str):
    #Get user's tags
    profile_tags_resp = supabaseDB.table("profile_tags") \
        .select("*") \
        .eq("profile_id", profile_id) \
        .execute()
    
    profile_tags = profile_tags_resp.data
    if not profile_tags:
        return {"events": [], "message": "Profile not found or has no tags."}
    


    events_resp = supabaseDB.table("events").select("id, name").execute()
    events = events_resp.data

    event_tags_resp = supabaseDB.table("event_tags").select("*").execute()
    event_tags = event_tags_resp.data

    event_to_tags = {}
    for et in event_tags:
        event_to_tags.setdefault(et["event_id"], []).append(et["tag_name"])

    recommended = []
    for event in events:
        e_tags = event_to_tags.get(event["id"], [])
        match_score = 0
        for p_tag in profile_tags:
            for e_tag in e_tags:
                score = similarity(p_tag["tag_name"], e_tag) * p_tag.get("weight", 1)   
                if score >= 0.45:  # Threshold for recommendation
                    match_score += score
        if match_score > 0:
            event_copy = event.copy()
            event_copy["score"] = match_score
            recommended.append(event_copy)
    
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
