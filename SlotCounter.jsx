import React from "react";
import { Card } from "@/components/ui/card";
import { ParkingCircle, CheckCircle, Calendar, AlertCircle } from "lucide-react";

export default function SlotCounter({ total, parked, reserved, available }) {
  const stats = [
    {
      label: "Total Slots",
      value: total,
      icon: ParkingCircle,
      color: "bg-blue-500",
      textColor: "text-blue-700",
      bgColor: "bg-blue-50",
    },
    {
      label: "Parked",
      value: parked,
      icon: AlertCircle,
      color: "bg-red-500",
      textColor: "text-red-700",
      bgColor: "bg-red-50",
    },
    {
      label: "Reserved",
      value: reserved,
      icon: Calendar,
      color: "bg-orange-500",
      textColor: "text-orange-700",
      bgColor: "bg-orange-50",
    },
    {
      label: "Available",
      value: available,
      icon: CheckCircle,
      color: "bg-green-500",
      textColor: "text-green-700",
      bgColor: "bg-green-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="p-6 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
              <p className={`text-3xl font-bold ${stat.textColor}`}>{stat.value}</p>
            </div>
            <div className={`${stat.bgColor} p-4 rounded-xl`}>
              <stat.icon className={`w-8 h-8 ${stat.color.replace('bg-', 'text-')}`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}