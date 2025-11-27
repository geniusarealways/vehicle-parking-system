import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Receipt, CheckCircle, AlertCircle, Search } from "lucide-react";
import { format, differenceInMinutes } from "date-fns";

export default function CheckoutBilling() {
  const queryClient = useQueryClient();
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [bill, setBill] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const urlParams = new URLSearchParams(window.location.search);
  const vehicleFromUrl = urlParams.get('vehicle');

  useEffect(() => {
    if (vehicleFromUrl) {
      setVehicleNumber(vehicleFromUrl);
      handleSearch(vehicleFromUrl);
    }
  }, [vehicleFromUrl]);

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
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ParkingEntry.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parkingEntries'] });
      setSuccessMessage("Vehicle checked out successfully!");
      setSelectedEntry(null);
      setBill(null);
      setVehicleNumber("");
      setTimeout(() => setSuccessMessage(""), 5000);
    },
    onError: (error) => {
      setErrorMessage("Failed to checkout vehicle. Please try again.");
      setTimeout(() => setErrorMessage(""), 3000);
    },
  });

  const calculateBill = (entry) => {
    if (!entry || !settings) return null;

    const entryTime = new Date(entry.entry_time);
    const exitTime = new Date();
    const durationMinutes = differenceInMinutes(exitTime, entryTime);
    const durationHours = Math.ceil(durationMinutes / 60);
    const totalAmount = durationHours * settings.parking_rate_per_hour;

    return {
      entryTime,
      exitTime,
      durationMinutes,
      durationHours,
      ratePerHour: settings.parking_rate_per_hour,
      totalAmount,
    };
  };

  const handleSearch = (searchValue = vehicleNumber) => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!searchValue) {
      setErrorMessage("Please enter a vehicle number");
      return;
    }

    const entry = parkingEntries.find(
      e => e.vehicle_number?.toLowerCase() === searchValue.toLowerCase() && e.status === 'Parked'
    );

    if (!entry) {
      setErrorMessage("Vehicle not found or already checked out");
      setSelectedEntry(null);
      setBill(null);
      return;
    }

    setSelectedEntry(entry);
    setBill(calculateBill(entry));
  };

  const handleCheckout = () => {
    if (!selectedEntry || !bill) return;

    const data = {
      status: "Exited",
      exit_time: bill.exitTime.toISOString(),
      duration_hours: bill.durationHours,
      total_amount: bill.totalAmount,
    };

    updateMutation.mutate({ id: selectedEntry.id, data });
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout & Billing</h1>
        <p className="text-gray-600">Process vehicle exit and calculate parking fees</p>
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

      <div className="max-w-3xl mx-auto space-y-6">
        <Card className="shadow-lg">
          <CardHeader className="border-b bg-gradient-to-r from-green-50 to-green-100">
            <CardTitle className="flex items-center gap-2 text-green-900">
              <Search className="w-6 h-6" />
              Find Vehicle
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex gap-3">
              <div className="flex-1">
                <Label htmlFor="vehicleNumber" className="mb-2 block">Vehicle Number</Label>
                <Input
                  id="vehicleNumber"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  placeholder="e.g., ABC-1234"
                  className="text-lg h-12 uppercase"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={() => handleSearch()}
                  className="bg-green-600 hover:bg-green-700 h-12 px-8"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Search
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedEntry && bill && (
          <>
            <Card className="shadow-lg border-2 border-green-200">
              <CardHeader className="border-b bg-green-50">
                <CardTitle className="flex items-center gap-2 text-green-900">
                  <Receipt className="w-6 h-6" />
                  Bill Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Vehicle Number</p>
                      <p className="text-lg font-bold text-gray-900">{selectedEntry.vehicle_number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Owner Name</p>
                      <p className="text-lg font-semibold text-gray-900">{selectedEntry.owner_name}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Vehicle Type</p>
                      <p className="font-medium">{selectedEntry.vehicle_type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Slot Number</p>
                      <p className="font-medium">#{selectedEntry.slot_number}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Entry Time</p>
                      <p className="font-medium">{format(bill.entryTime, 'MMM dd, yyyy')}</p>
                      <p className="font-medium">{format(bill.entryTime, 'hh:mm a')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Exit Time</p>
                      <p className="font-medium">{format(bill.exitTime, 'MMM dd, yyyy')}</p>
                      <p className="font-medium">{format(bill.exitTime, 'hh:mm a')}</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
 