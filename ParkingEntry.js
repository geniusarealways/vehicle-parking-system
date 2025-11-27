{
  "name": "ParkingEntry",
  "type": "object",
  "properties": {
    "vehicle_number": {
      "type": "string",
      "description": "Vehicle registration number"
    },
    "vehicle_type": {
      "type": "string",
      "enum": [
        "Bike",
        "Car"
      ],
      "description": "Type of vehicle"
    },
    "owner_name": {
      "type": "string",
      "description": "Name of the vehicle owner"
    },
    "entry_time": {
      "type": "string",
      "format": "date-time",
      "description": "When vehicle entered parking"
    },
    "exit_time": {
      "type": "string",
      "format": "date-time",
      "description": "When vehicle exited parking"
    },
    "slot_number": {
      "type": "number",
      "description": "Assigned parking slot number"
    },
    "status": {
      "type": "string",
      "enum": [
        "Parked",
        "Exited"
      ],
      "default": "Parked",
      "description": "Current status of the vehicle"
    },
    "reservation_flag": {
      "type": "string",
      "enum": [
        "Yes",
        "No"
      ],
      "default": "No",
      "description": "Whether this entry is from a reservation"
    },
    "duration_hours": {
      "type": "number",
      "description": "Total parking duration in hours"
    },
    "total_amount": {
      "type": "number",
      "description": "Total parking fee charged"
    }
  },
  "required": [
    "vehicle_number",
    "vehicle_type",
    "owner_name",
    "entry_time",
    "slot_number",
    "status"
  ]
}