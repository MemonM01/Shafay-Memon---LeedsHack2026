import EventCard from "../components/EventCard";
import "../styles/grid.css";

const event = {title: "Title",
  imageUrl: "url",
  venueName: "Name",
  address: "Address",
  priceText: "Price",
  dateText: "Date"}

const events = [
    event, event, event, event, event, event
];

export default function Grid(){

    return(
    <div className="page">
        <div className="page-content">
            <div className="grid-container">
                {events.map((item) => (
                    <EventCard
                    title={item.title}
                    imageUrl={item.imageUrl}
                    venueName={item.venueName}
                    address={item.address}
                    priceText={item.priceText}
                    dateText={item.dateText}
                    />
                ))}
            </div>
        </div>
    </div>
    );
}
