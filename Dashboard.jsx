import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, Car, Clock } from "lucide-react";
import SlotCounter from "../components/parking/SlotCounter";
import { format, startOfDay, endOfDay } from "date-fns";

export default function Dashboard() {
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const list = await base44.entities.Settings.list();
      return list[0] || null;
    },
  });

  const { data: parkingEntries = [], isLoading: entriesLoading } = useQuery({
    queryKey: ['parkingEntries'],
    queryFn: () => base44.entities.ParkingEntry.list('-entry_time'),
    refetchInterval: 5000,
  });

  const { data: reservations = [], isLoading: reservationsLoading } = useQuery({
    queryKey: ['reservations'],
    queryFn: () => base44.entities.Reservation.list('-reservation_datetime'),
    refetchInterval: 5000,
  });

  const parkedVehicles = parkingEntries.filter(e => e.status === 'Parked').length;
  const activeReservations = reservations.filter(r => r.status === 'Reserved').length;
  const totalSlots = settings?.total_slots || 0;
  const availableSlots = totalSlots - parkedVehicles - activeReservations;

  const todayEntries = parkingEntries.filter(e => {
    const entryDate = new Date(e.entry_time);
    const today = new Date();
    return entryDate.toDateString() === today.toDateString();
  });

  const todayRevenue = parkingEntries
    .filter(e => {
      const entryDate = new Date(e.entry_time);
      const today = new Date();
      return entryDate.toDateString() === today.toDateString() && e.status === 'Exited';
    })
    .reduce((sum, e) => sum + (e.total_amount || 0), 0);

  const recentVehicles = parkingEntries.filter(e => e.status === 'Parked').slice(0, 5);

  if (settingsLoading || entriesLoading || reservationsLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-8">
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-6">
            <p className="text-orange-800">
              Please configure parking settings first. Go to <strong>Admin Settings</strong> to set total slots and parking rate.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Real-time parking overview and statistics</p>
      </div>

      <SlotCounter
        total={totalSlots}
        parked={parkedVehicles}
        reserved={activeReservations}
        available={Math.max(0, availableSlots)}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Car className="w-4 h-4" />
              Today's Entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{todayEntries.length}</p>
            <p className="text-xs text-gray-500 mt-1">Vehicles parked today</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Today's Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">${todayRevenue.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">Total collected</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Parking Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-600">${settings.parking_rate_per_hour}</p>
            <p className="text-xs text-gray-500 mt-1">Per hour</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Occupancy Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">
              {totalSlots > 0 ? Math.round((parkedVehicles / totalSlots) * 100) : 0}%
            </p>
            <p className="text-xs text-gray-500 mt-1">Current utilization</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Currently Parked Vehicles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Slot</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Vehicle Number</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Type</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Owner</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Entry Time</th>
                </tr>
              </thead>
              <tbody>
                {recentVehicles.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center p-8 text-gray-500">
                      No vehicles currently parked
                    </td>
                  </tr>
                ) : (
                  recentVehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-3">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full font-semibold text-sm">
                          {vehicle.slot_number}
                        </span>
                      </td>
                      <td className="p-3 font-medium">{vehicle.vehicle_number}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          vehicle.vehicle_type === 'Car' 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {vehicle.vehicle_type}
                        </span>
                      </td>
                      <td className="p-3">{vehicle.owner_name}</td>
                      <td className="p-3 text-sm text-gray-600">
                        {format(new Date(vehicle.entry_time), 'MMM dd, yyyy hh:mm a')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}