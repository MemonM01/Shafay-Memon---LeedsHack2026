export type Event = {
    id: string
    title: string
    description: string
    location: string
    date: string
    time: string
    image: string
    position: [number, number]
    ownerProfilePictureUrl?: string
    tags?: string[]
    interestCount?: number
    isUserInterested?: boolean
    score?: number
    owner_id?: string
}