{
  "name": "Settings",
  "type": "object",
  "properties": {
    "total_slots": {
      "type": "number",
      "description": "Total number of parking slots available"
    },
    "parking_rate_per_hour": {
      "type": "number",
      "description": "Cost per hour for parking"
    }
  },
  "required": [
    "total_slots",
    "parking_rate_per_hour"
  ]
}