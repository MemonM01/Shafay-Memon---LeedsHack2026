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
            
         