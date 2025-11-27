import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Settings as SettingsIcon, CheckCircle, AlertCircle } from "lucide-react";

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const [totalSlots, setTotalSlots] = useState("");
  const [parkingRate, setParkingRate] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const list = await base44.entities.Settings.list();
      return list[0] || null;
    },
  });

  useEffect(() => {
    if (settings) {
      setTotalSlots(settings.total_slots?.toString() || "");
      setParkingRate(settings.parking_rate_per_hour?.toString() || "");
    }
  }, [settings]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Settings.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setSuccessMessage("Settings created successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    },
    onError: (error) => {
      setErrorMessage("Failed to create settings. Please try again.");
      setTimeout(() => setErrorMessage(""), 3000);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Settings.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setSuccessMessage("Settings updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    },
    onError: (error) => {
      setErrorMessage("Failed to update settings. Please try again.");
      setTimeout(() => setErrorMessage(""), 3000);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!totalSlots || !parkingRate) {
      setErrorMessage("All fields are required");
      return;
    }

    if (parseInt(totalSlots) <= 0) {
      setErrorMessage("Total slots must be greater than 0");
      return;
    }

    if (parseFloat(parkingRate) <= 0) {
      setErrorMessage("Parking rate must be greater than 0");
      return;
    }

    const data = {
      total_slots: parseInt(totalSlots),
      parking_rate_per_hour: parseFloat(parkingRate),
    };

    if (settings) {
      updateMutation.mutate({ id: settings.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Settings</h1>
        <p className="text-gray-600">Configure parking lot capacity and pricing</p>
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

      <Card className="shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-blue-100">
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <SettingsIcon className="w-6 h-6" />
            Parking Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="totalSlots" className="text-base font-semibold">
                Total Parking Slots
              </Label>
              <Input
                id="totalSlots"
                type="number"
                min="1"
                value={totalSlots}
                onChange={(e) => setTotalSlots(e.target.value)}
                placeholder="Enter total number of slots"
                className="text-lg h-12"
              />
              <p className="text-sm text-gray-500">
                Total number of parking spaces available in your facility
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="parkingRate" className="text-base font-semibold">
                Parking Rate (per hour)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">
                  $
                </span>
                <Input
                  id="parkingRate"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={parkingRate}
                  onChange={(e) => setParkingRate(e.target.value)}
                  placeholder="0.00"
                  className="text-lg h-12 pl-8"
                />
              </div>
              <p className="text-sm text-gray-500">
                Cost charged per hour of parking
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-gray-500">
                {settings ? "Last updated: " + new Date(settings.updated_date).toLocaleString() : "No settings configured yet"}
              </div>
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 px-8 h-12 text-base font-semibold"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    {settings ? "Update Settings" : "Save Settings"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {settings && (
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-blue-900 mb-3">Current Configuration</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-blue-700 mb-1">Total Slots</p>
                <p className="text-2xl font-bold text-blue-900">{settings.total_slots}</p>
              </div>
              <div>
                <p className="text-sm text-blue-700 mb-1">Hourly Rate</p>
                <p className="text-2xl font-bold text-blue-900">${settings.parking_rate_per_hour}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}