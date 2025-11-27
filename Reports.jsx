import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, DollarSign, Car, TrendingUp } from "lucide-react";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function Reports() {
  const [reportType, setReportType] = useState("daily");

  const { data: parkingEntries = [], isLoading } = useQuery({
    queryKey: ['parkingEntries'],
    queryFn: () => base44.entities.ParkingEntry.list('-entry_time'),
  });

  const { data: reservations = [] } = useQuery({
    queryKey: ['reservations'],
    queryFn: () => base44.entities.Reservation.list('-reservation_datetime'),
  });

  const getDateRange = () => {
    const now = new Date();
    switch (reportType) {
      case "daily":
        return { start: startOfDay(now), end: endOfDay(now), label: "Today" };
      case "weekly":
        return { start: startOfWeek(now), end: endOfWeek(now), label: "This Week" };
      case "monthly":
        return { start: startOfMonth(now), end: endOfMonth(now), label: "This Month" };
      default:
        return { start: startOfDay(now), end: endOfDay(now), label: "Today" };
    }
  };

  const { start, end, label } = getDateRange();

  const filteredEntries = parkingEntries.filter(e => {
    const entryDate = new Date(e.entry_time);
    return entryDate >= start && entryDate <= end;
  });

  const exitedVehicles = filteredEntries.filter(e => e.status === 'Exited');
  const totalVehicles = filteredEntries.length;
  const totalRevenue = exitedVehicles.reduce((sum, e) => sum + (e.total_amount || 0), 0);
  
  const reservedCount = reservations.filter(r => {
    const resDate = new Date(r.reservation_datetime);
    return resDate >= start && resDate <= end;
  }).length;

  const walkinCount = filteredEntries.filter(e => e.reservation_flag === 'No').length;

  const vehicleTypeData = [
    {
      name: 'Cars',
      value: filteredEntries.filter(e => e.vehicle_type === 'Car').length,
    },
    {
      name: 'Bikes',
      value: filteredEntries.filter(e => e.vehicle_type === 'Bike').length,
    },
  ];

  const hourlyData = Array.from({ length: 24 }, (_, hour) => {
    const count = filteredEntries.filter(e => {
      const entryHour = new Date(e.entry_time).getHours();
      return entryHour === hour;
    }).length;
    return {
      hour: `${hour}:00`,
      vehicles: count,
    };
  }).filter(d => d.vehicles > 0);

  const COLORS = ['#3b82f6', '#8b5cf6'];

  const exportToCSV = () => {
    const headers = ['Vehicle Number', 'Owner Name', 'Type', 'Entry Time', 'Exit Time', 'Duration (hrs)', 'Amount'];
    const rows = exitedVehicles.map(e => [
      e.vehicle_number,
      e.owner_name,
      e.vehicle_type,
      format(new Date(e.entry_time), 'yyyy-MM-dd HH:mm'),
      e.exit_time ? format(new Date(e.exit_time), 'yyyy-MM-dd HH:mm') : '-',
      e.duration_hours || '-',
      e.total_amount ? `$${e.total_amount.toFixed(2)}` : '-',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `parking-report-${reportType}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
          <p className="text-gray-600">View parking statistics and generate reports</p>
        </div>
        <Button 
          onClick={exportToCSV}
          className="bg-green-600 hover:bg-green-700"
        >
          <Download className="w-4 h-4 mr-2" />
          Export to CSV
        </Button>
      </div>

      <Card className="mb-6 shadow-lg">
        <CardContent className="p-6">
          <Tabs value={reportType} onValueChange={setReportType}>
            <TabsList className="grid w-full md:w-auto grid-cols-3 gap-2">
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Car className="w-4 h-4" />
              Total Vehicles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{totalVehicles}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">${totalRevenue.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">From {exitedVehicles.length} checkouts</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Walk-in Vehicles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-600">{walkinCount}</p>
            <p className="text-xs text-gray-500 mt-1">Direct entries</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Reservations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">{reservedCount}</p>
            <p className="text-xs text-gray-500 mt-1">Pre-booked spots</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="shadow-lg">
          <CardHeader className="border-b">
            <CardTitle>Peak Hours Analysis</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="vehicles" fill="#3b82f6" name="Vehicles" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="border-b">
            <CardTitle>Vehicle Type Distribution</CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={vehicleTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {vehicleTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="border-b">
          <CardTitle>Detailed Transaction Log</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">Vehicle</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">Owner</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">Type</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">Entry</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">Exit</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">Duration</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center p-8 text-gray-500">
                      No transactions found for {label.toLowerCase()}
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry) => (
                    <tr key={entry.id} className="border-b hover:bg-gray-50">
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
                      <td className="p-4 text-sm">
                        {format(new Date(entry.entry_time), 'MMM dd, hh:mm a')}
                      </td>
                      <td className="p-4 text-sm">
                        {entry.exit_time ? format(new Date(entry.exit_time), 'MMM dd, hh:mm a') : '-'}
                      </td>
                      <td className="p-4">
                        {entry.duration_hours ? `${entry.duration_hours} hrs` : '-'}
                      </td>
                      <td className="p-4 font-semibold text-green-600">
                        {entry.total_amount ? `$${entry.total_amount.toFixed(2)}` : '-'}
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