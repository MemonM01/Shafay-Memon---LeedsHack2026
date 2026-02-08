from sentence_transformers import SentenceTransformer, util

model = SentenceTransformer('all-MiniLM-L6-v2')

def similarity(tag1, tag2):
    e1 = model.encode(tag1)
    e2 = model.encode(tag2)
    return util.cos_sim(e1, e2).item()
