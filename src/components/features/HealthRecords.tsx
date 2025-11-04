import { useState } from "react";
import { FileText, Download, Calendar, User, Stethoscope, Pill, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

export const HealthRecords = () => {
  const { toast } = useToast();

  // Mock health records data
  const records = {
    consultations: [
      {
        id: 1,
        provider: "Dr. Michael Okafor",
        specialty: "Endocrinologist",
        date: "2024-01-15",
        diagnosis: "Type 2 Diabetes - Regular monitoring",
        notes: "Blood sugar levels stable. Continue current medication regimen.",
        status: "Completed"
      },
      {
        id: 2,
        provider: "Dr. Amina Hassan",
        specialty: "General Practice",
        date: "2024-01-10",
        diagnosis: "Annual Health Checkup",
        notes: "Overall health good. Recommended lifestyle modifications.",
        status: "Completed"
      }
    ],
    medications: [
      {
        id: 1,
        name: "Metformin",
        dosage: "500mg",
        frequency: "Twice daily",
        prescribedBy: "Dr. Michael Okafor",
        startDate: "2024-01-15",
        status: "Active"
      },
      {
        id: 2,
        name: "Lisinopril",
        dosage: "10mg",
        frequency: "Once daily",
        prescribedBy: "Dr. Michael Okafor",
        startDate: "2024-01-15",
        status: "Active"
      }
    ],
    vitals: [
      {
        id: 1,
        type: "Blood Pressure",
        value: "120/80 mmHg",
        date: "2024-01-15",
        status: "Normal"
      },
      {
        id: 2,
        type: "Blood Sugar",
        value: "95 mg/dL",
        date: "2024-01-15",
        status: "Normal"
      },
      {
        id: 3,
        type: "Weight",
        value: "68 kg",
        date: "2024-01-15",
        status: "Normal"
      }
    ]
  };

  const handleDownloadRecord = (type: string) => {
    toast({
      title: "Download Started",
      description: `Your ${type} record is being prepared for download.`
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground font-display">My Health Records</h2>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export All
        </Button>
      </div>

      <Tabs defaultValue="consultations" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="consultations">Consultations</TabsTrigger>
          <TabsTrigger value="medications">Medications</TabsTrigger>
          <TabsTrigger value="vitals">Vitals</TabsTrigger>
        </TabsList>

        <TabsContent value="consultations" className="space-y-4">
          {records.consultations.map((consultation) => (
            <Card key={consultation.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-foreground flex items-center">
                      <Stethoscope className="w-4 h-4 mr-2" />
                      {consultation.provider}
                    </h3>
                    <p className="text-sm text-muted-foreground">{consultation.specialty}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(consultation.date).toLocaleDateString()}
                    </p>
                    <Badge variant="secondary" className="mt-1">
                      {consultation.status}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <strong>Diagnosis:</strong> {consultation.diagnosis}
                  </div>
                  <div>
                    <strong>Notes:</strong> {consultation.notes}
                  </div>
                </div>
                <div className="mt-4 flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDownloadRecord("consultation")}
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="medications" className="space-y-4">
          {records.medications.map((medication) => (
            <Card key={medication.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground flex items-center">
                      <Pill className="w-4 h-4 mr-2" />
                      {medication.name}
                    </h3>
                    <p className="text-muted-foreground">{medication.dosage} - {medication.frequency}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Prescribed by {medication.prescribedBy}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={medication.status === "Active" ? "default" : "secondary"}
                    >
                      {medication.status}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      Since {new Date(medication.startDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="vitals" className="space-y-4">
          {records.vitals.map((vital) => (
            <Card key={vital.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground flex items-center">
                      <Activity className="w-4 h-4 mr-2" />
                      {vital.type}
                    </h3>
                    <p className="text-lg font-bold text-primary">{vital.value}</p>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={vital.status === "Normal" ? "secondary" : "destructive"}
                    >
                      {vital.status}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(vital.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};