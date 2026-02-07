export type Event = {
    id: string
    title: string
    description: string
    location: string
    date: string
    time: string
    image: string
    position: [number, number]
    tags?: string[]
    interestCount?: number
    isUserInterested?: boolean
}