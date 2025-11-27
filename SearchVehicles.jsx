import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search, Filter, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function SearchVehicles() {
  const [searchVehicle, setSearchVehicle] = useState("");
  const [searchOwner, setSearchOwner] = useState("");
  const [searchSlot, setSearchSlot] = useState("");
  const [searchDateFrom, setSearchDateFrom] = useState("");
  const [searchDateTo, setSearchDateTo] = useState("");

  const { data: parkingEntries = [], isLoading } = useQuery({
    queryKey: ['parkingEntries'],
    queryFn: () => base44.entities.ParkingEntry.list('-entry_time'),
  });

  const { data: reservations = [] } = useQuery({
    queryKey: ['reservations'],
    queryFn: () => base44.entities.Reservation.list('-reservation_datetime'),
  });

  const filteredEntries = parkingEntries.filter((entry) => {
    const vehicleMatch = !searchVehicle || entry.vehicle_number?.toLowerCase().includes(searchVehicle.toLowerCase());
    const ownerMatch = !searchOwner || entry.owner_name?.toLowerCase().includes(searchOwner.toLowerCase());
    const slotMatch = !searchSlot || entry.slot_number?.toString() === searchSlot;
    
    let dateMatch = true;
    if (searchDateFrom || searchDateTo) {
      const entryDate = new Date(entry.entry_time);
      if (searchDateFrom) {
        dateMatch = dateMatch && entryDate >= new Date(searchDateFrom);
      }
      if (searchDateTo) {
        const toDate = new Date(searchDateTo);
        toDate.setHours(23, 59, 59, 999);
        dateMatch = dateMatch && entryDate <= toDate;
      }
    }

    return vehicleMatch && ownerMatch && slotMatch && dateMatch;
  });

  const handleReset = () => {
    setSearchVehicle("");
    setSearchOwner("");
    setSearchSlot("");
    setSearchDateFrom("");
    setSearchDateTo("");
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Search Vehicles</h1>
        <p className="text-gray-600">Find vehicles by number, owner, slot, or date</p>
      </div>

      <Card className="mb-6 shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-purple-100">
          <CardTitle className="flex items-center gap-2 text-purple-900">
            <Filter className="w-6 h-6" />
            Search Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="searchVehicle">Vehicle Number</Label>
              <Input
                id="searchVehicle"
                value={searchVehicle}
                onChange={(e) => setSearchVehicle(e.target.value)}
                placeholder="e.g., ABC-1234"
                className="uppercase"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="searchOwner">Owner Name</Label>
              <Input
                id="searchOwner"
                value={searchOwner}
                onChange={(e) => setSearchOwner(e.target.value)}
                placeholder="Enter owner name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="searchSlot">Slot Number</Label>
              <Input
                id="searchSlot"
                type="number"
                value={searchSlot}
                onChange={(e) => setSearchSlot(e.target.value)}
                placeholder="e.g., 5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="searchDateFrom">From Date</Label>
              <Input
                id="searchDateFrom"
                type="date"
                value={searchDateFrom}
                onChange={(e) => setSearchDateFrom(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="searchDateTo">To Date</Label>
              <Input
                id="searchDateTo"
                type="date"
                value={searchDateTo}
                onChange={(e) => setSearchDateTo(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button 
                onClick={handleReset}
                variant="outline"
                className="w-full"
              >
                Reset Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Search className="w-6 h-6" />
              Search Results
            </span>
            <span className="text-sm font-normal text-gray-600">
              {filteredEntries.length} {filteredEntries.length === 1 ? 'result' : 'results'} found
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">Vehicle Number</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">Owner Name</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">Type</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">Slot</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">Entry Time</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="7" className="text-center p-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    </td>
                  </tr>
                ) : filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center p-8 text-gray-500">
                      No vehicles found matching your search criteria
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry) => (
                    <tr key={entry.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-semibold">{entry.vehicle_number}</td>
                      <td className="p-4">{entry.owner_name}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          entry.vehicle_type === 'Car' 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {entry.vehicle_type}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full font-semibold text-sm">
                          {entry.slot_number}
                        </span>
                      </td>
                      <td className="p-4 text-sm">
                        {format(new Date(entry.entry_time), 'MMM dd, yyyy hh:mm a')}
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          entry.status === 'Parked' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {entry.status}
                        </span>
                      </td>
                      <td className="p-4">
                        {entry.status === 'Parked' && (
                          <Link to={`${createPageUrl("CheckoutBilling")}?vehicle=${entry.vehicle_number}`}>
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                              <ExternalLink className="w-4 h-4 mr-1" />
                              Checkout
                            </Button>
                          </Link>
                        )}
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