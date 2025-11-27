import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CarFront, CheckCircle, AlertCircle, ParkingCircle } from "lucide-react";
import SlotCounter from "../components/parking/SlotCounter";

export default function VehicleEntry() {
  const queryClient = useQueryClient();
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const list = await base44.entities.Settings.list();
      return list[0] || null;
    },
  });

  const { data: parkingEntries = [] } = useQuery({
    queryKey: ['parkingEntries'],
    queryFn: () => base44.entities.ParkingEntry.list('-entry_time'),
    refetchInterval: 5000,
  });

  const { data: reservations = [] } = useQuery({
    queryKey: ['reservations'],
    queryFn: () => base44.entities.Reservation.list('-reservation_datetime'),
    refetchInterval: 5000,
  });

  const parkedVehicles = parkingEntries.filter(e => e.status === 'Parked').length;
  const activeReservations = reservations.filter(r => r.status === 'Reserved').length;
  const totalSlots = settings?.total_slots || 0;
  const availableSlots = totalSlots - parkedVehicles - activeReservations;

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ParkingEntry.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parkingEntries'] });
      setSuccessMessage("Vehicle registered successfully!");
      setVehicleNumber("");
      setVehicleType("");
      setOwnerName("");
      setTimeout(() => setSuccessMessage(""), 3000);
    },
    onError: (error) => {
      setErrorMessage("Failed to register vehicle. Please try again.");
      setTimeout(() => setErrorMessage(""), 3000);
    },
  });

  const getNextAvailableSlot = () => {
    const occupiedSlots = parkingEntries
      .filter(e => e.status === 'Parked')
      .map(e => e.slot_number);
    
    const reservedSlots = reservations
      .filter(r => r.status === 'Reserved')
      .map(r => r.slot_number);

    const allOccupied = [...occupiedSlots, ...reservedSlots];

    for (let i = 1; i <= totalSlots; i++) {
      if (!allOccupied.includes(i)) {
        return i;
      }
    }
    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!settings) {
      setErrorMessage("Please configure settings first (Admin Settings)");
      return;
    }

    if (!vehicleNumber || !vehicleType || !ownerName) {
      setErrorMessage("All fields are required");
      return;
    }

    if (availableSlots <= 0) {
      setErrorMessage("Parking is FULL! No slots available.");
      return;
    }

    const nextSlot = getNextAvailableSlot();
    if (!nextSlot) {
      setErrorMessage("No available slots found");
      return;
    }

    const data = {
      vehicle_number: vehicleNumber.toUpperCase(),
      vehicle_type: vehicleType,
      owner_name: ownerName,
      entry_time: new Date().toISOString(),
      slot_number: nextSlot,
      status: "Parked",
      reservation_flag: "No",
    };

    createMutation.mutate(data);
  };

  if (!settings) {
    return (
      <div className="p-8">
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            Please configure parking settings first. Go to <strong>Admin Settings</strong> to set total slots and parking rate.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Vehicle Entry</h1>
        <p className="text-gray-600">Register new vehicle entering the parking lot</p>
      </div>

      <div className="mb-6">
        <SlotCounter
          total={totalSlots}
          parked={parkedVehicles}
          reserved={activeReservations}
          available={Math.max(0, availableSlots)}
        />
      </div>

      {successMessage && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
        </Alert>
      )}

      {errorMessage && (
        <Alert className="mb-6 bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{errorMessage}</AlertDescription>
        </Alert>
      )}

      {availableSlots <= 0 && (
        <Alert className="mb-6 bg-red-100 border-red-300">
          <AlertCircle className="h-5 w-5 text-red-700" />
          <AlertDescription className="text-red-900 font-semibold text-lg">
            PARKING FULL - No slots available!
          </AlertDescription>
        </Alert>
      )}

      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-blue-100">
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <CarFront className="w-6 h-6" />
              New Vehicle Registration
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="vehicleNumber" className="text-base font-semibold">
                  Vehicle Number *
                </Label>
                <Input
                  id="vehicleNumber"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  placeholder="e.g., ABC-1234"
                  className="text-lg h-12 uppercase"
                  disabled={availableSlots <= 0}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicleType" className="text-base font-semibold">
                  Vehicle Type *
                </Label>
                <Select value={vehicleType} onValueChange={setVehicleType} disabled={availableSlots <= 0}>
                  <SelectTrigger className="text-lg h-12">
                    <SelectValue placeholder="Select vehicle type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bike">Bike</SelectItem>
                    <SelectItem value="Car">Car</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownerName" className="text-base font-semibold">
                  Owner Name *
                </Label>
                <Input
 