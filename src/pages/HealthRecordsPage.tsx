import { useState } from "react";
import { ArrowLeft, FileText, Download, Calendar, User, Stethoscope, Pill, Activity, Search, Filter, Share, Lock, Plus, Eye, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const HealthRecordsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);

  // Enhanced mock health records data
  const records = {
    consultations: [
      {
        id: 1,
        provider: "Dr. Michael Okafor",
        specialty: "Endocrinologist",
        date: "2024-01-15",
        diagnosis: "Type 2 Diabetes - Regular monitoring",
        notes: "Blood sugar levels stable at 120mg/dL. Continue current medication regimen. Patient shows good compliance with lifestyle modifications. Recommend quarterly HbA1c testing.",
        status: "Completed",
        vitals: {
          bloodPressure: "125/82 mmHg",
          heartRate: "72 bpm",
          weight: "68 kg",
          temperature: "36.5°C"
        },
        prescriptions: ["Metformin 500mg", "Lisinopril 10mg"],
        followUp: "3 months",
        cost: "₦15,000"
      },
      {
        id: 2,
        provider: "Dr. Amina Hassan",
        specialty: "General Practice",
        date: "2024-01-10",
        diagnosis: "Annual Health Checkup - Normal findings",
        notes: "Comprehensive physical examination completed. All systems within normal limits. Immunizations up to date. Continue current preventive care routine.",
        status: "Completed",
        vitals: {
          bloodPressure: "118/76 mmHg",
          heartRate: "68 bpm",
          weight: "67.5 kg",
          temperature: "36.2°C"
        },
        prescriptions: [],
        followUp: "1 year",
        cost: "₦8,000"
      },
      {
        id: 3,
        provider: "Dr. Kemi Adebayo",
        specialty: "Cardiologist",
        date: "2024-01-08",
        diagnosis: "Cardiovascular Risk Assessment",
        notes: "ECG and echocardiogram results normal. Low cardiovascular risk profile. Recommend continued exercise and healthy diet. Monitor cholesterol levels.",
        status: "Completed",
        vitals: {
          bloodPressure: "115/75 mmHg",
          heartRate: "65 bpm",
          weight: "68 kg",
          temperature: "36.4°C"
        },
        prescriptions: ["Omega-3 supplements"],
        followUp: "6 months",
        cost: "₦25,000"
      }
    ],
    medications: [
      {
        id: 1,
        name: "Metformin",
        dosage: "500mg",
        frequency: "Twice daily with meals",
        prescribedBy: "Dr. Michael Okafor",
        startDate: "2023-06-15",
        endDate: null,
        status: "Active",
        purpose: "Blood sugar control",
        sideEffects: "Mild nausea (resolved)",
        instructions: "Take with food to reduce stomach upset"
      },
      {
        id: 2,
        name: "Lisinopril",
        dosage: "10mg",
        frequency: "Once daily in morning",
        prescribedBy: "Dr. Michael Okafor",
        startDate: "2023-06-15",
        endDate: null,
        status: "Active",
        purpose: "Blood pressure management",
        sideEffects: "None reported",
        instructions: "Take consistently at same time each day"
      },
      {
        id: 3,
        name: "Omega-3",
        dosage: "1000mg",
        frequency: "Once daily",
        prescribedBy: "Dr. Kemi Adebayo",
        startDate: "2024-01-08",
        endDate: "2024-07-08",
        status: "Active",
        purpose: "Cardiovascular health",
        sideEffects: "None",
        instructions: "Take with largest meal of the day"
      }
    ],
    vitals: [
      {
        id: 1,
        type: "Blood Pressure",
        value: "125/82 mmHg",
        date: "2024-01-15",
        status: "Normal",
        provider: "Dr. Michael Okafor",
        trend: "stable"
      },
      {
        id: 2,
        type: "Blood Sugar (Fasting)",
        value: "95 mg/dL",
        date: "2024-01-15",
        status: "Normal",
        provider: "Dr. Michael Okafor",
        trend: "improving"
      },
      {
        id: 3,
        type: "Weight",
        value: "68 kg",
        date: "2024-01-15",
        status: "Normal",
        provider: "Dr. Michael Okafor",
        trend: "stable"
      },
      {
        id: 4,
        type: "HbA1c",
        value: "6.2%",
        date: "2024-01-10",
        status: "Well Controlled",
        provider: "Dr. Michael Okafor",
        trend: "improving"
      },
      {
        id: 5,
        type: "Cholesterol (Total)",
        value: "185 mg/dL",
        date: "2024-01-08",
        status: "Normal",
        provider: "Dr. Kemi Adebayo",
        trend: "stable"
      }
    ],
    labResults: [
      {
        id: 1,
        testName: "Complete Blood Count (CBC)",
        date: "2024-01-10",
        status: "Normal",
        provider: "Dr. Amina Hassan",
        results: {
          "Hemoglobin": "13.5 g/dL (Normal)",
          "White Blood Cells": "6,800/μL (Normal)",
          "Platelets": "250,000/μL (Normal)"
        }
      },
      {
        id: 2,
        testName: "Lipid Profile",
        date: "2024-01-08",
        status: "Normal",
        provider: "Dr. Kemi Adebayo",
        results: {
          "Total Cholesterol": "185 mg/dL (Normal)",
          "LDL": "110 mg/dL (Normal)",
          "HDL": "55 mg/dL (Normal)",
          "Triglycerides": "120 mg/dL (Normal)"
        }
      }
    ]
  };

  const handleDownloadRecord = (type: string, id?: number) => {
    toast({
      title: "Download Started",
      description: `Your ${type} record is being prepared for download.`
    });
  };

  const getTrendIcon = (trend: string) => {
    if (trend === "improving") return "↗️";
    if (trend === "declining") return "↘️";
    return "→";
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'normal': 
      case 'well controlled':
      case 'active':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'high':
      case 'low':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical':
      case 'expired':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-muted-foreground bg-muted border-border';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
        <div className="flex items-center space-x-4 mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/dashboard')}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold font-display">My Health Records</h1>
            <p className="text-white/90">Complete medical history at your fingertips</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4 text-center">
              <Stethoscope className="w-6 h-6 mx-auto mb-2 text-blue-200" />
              <p className="text-2xl font-bold">{records.consultations.length}</p>
              <p className="text-white/90 text-sm">Consultations</p>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4 text-center">
              <Pill className="w-6 h-6 mx-auto mb-2 text-green-200" />
              <p className="text-2xl font-bold">{records.medications.filter(m => m.status === 'Active').length}</p>
              <p className="text-white/90 text-sm">Active Medications</p>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4 text-center">
              <Activity className="w-6 h-6 mx-auto mb-2 text-purple-200" />
              <p className="text-2xl font-bold">{records.vitals.length}</p>
              <p className="text-white/90 text-sm">Vital Records</p>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4 text-center">
              <FileText className="w-6 h-6 mx-auto mb-2 text-orange-200" />
              <p className="text-2xl font-bold">{records.labResults.length}</p>
              <p className="text-white/90 text-sm">Lab Results</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Action Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div className="flex space-x-3">
            <Button variant="default" size="lg" className="gradient-premium text-white">
              <Download className="w-4 h-4 mr-2" />
              Export All Records
            </Button>
            <Button variant="outline" size="lg">
              <Share className="w-4 h-4 mr-2" />
              Share with Provider
            </Button>
            <Button variant="outline" size="lg">
              <Plus className="w-4 h-4 mr-2" />
              Add Record
            </Button>
          </div>

          <div className="flex space-x-4">
            <Input
              placeholder="Search records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-80"
            />
          </div>
        </div>

        <Tabs defaultValue="consultations" className="w-full">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="consultations" className="flex items-center">
              <Stethoscope className="w-4 h-4 mr-2" />
              Consultations
            </TabsTrigger>
            <TabsTrigger value="medications" className="flex items-center">
              <Pill className="w-4 h-4 mr-2" />
              Medications
            </TabsTrigger>
            <TabsTrigger value="vitals" className="flex items-center">
              <Activity className="w-4 h-4 mr-2" />
              Vitals & Labs
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Documents
            </TabsTrigger>
          </TabsList>

          <TabsContent value="consultations" className="space-y-4">
            {records.consultations.map((consultation) => (
              <Card key={consultation.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {consultation.provider.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-foreground flex items-center">
                          {consultation.provider}
                        </h3>
                        <p className="text-sm text-muted-foreground">{consultation.specialty}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm">
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(consultation.date).toLocaleDateString()}
                          </span>
                          <span className="text-green-600">₦{consultation.cost}</span>
                        </div>
                      </div>
                    </div>
                    <Badge className={getStatusColor(consultation.status)}>
                      {consultation.status}
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Diagnosis & Notes</h4>
                      <p className="text-sm text-muted-foreground mb-2">{consultation.diagnosis}</p>
                      <p className="text-sm bg-muted p-3 rounded-lg">{consultation.notes}</p>
                    </div>

                    {consultation.vitals && (
                      <div>
                        <h4 className="font-medium mb-2">Vitals Recorded</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {Object.entries(consultation.vitals).map(([key, value]) => (
                            <div key={key} className="bg-blue-50 p-3 rounded-lg">
                              <p className="text-xs text-blue-600 mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                              <p className="font-semibold text-blue-800">{value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="text-sm text-muted-foreground">
                        Follow-up: {consultation.followUp}
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-3 h-3 mr-1" />
                          View Details
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDownloadRecord("consultation", consultation.id)}>
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="medications" className="space-y-4">
            {records.medications.map((medication) => (
              <Card key={medication.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-foreground flex items-center">
                        <Pill className="w-5 h-5 mr-2 text-green-600" />
                        {medication.name} {medication.dosage}
                      </h3>
                      <p className="text-muted-foreground">{medication.frequency}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Prescribed by {medication.prescribedBy}
                      </p>
                    </div>
                    <Badge className={getStatusColor(medication.status)}>
                      {medication.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium">Purpose</p>
                      <p className="text-sm text-muted-foreground">{medication.purpose}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Start Date</p>
                      <p className="text-sm text-muted-foreground">{new Date(medication.startDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Instructions</p>
                      <p className="text-sm text-muted-foreground">{medication.instructions}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Side Effects</p>
                      <p className="text-sm text-muted-foreground">{medication.sideEffects}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="vitals" className="space-y-6">
            {/* Vitals Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Recent Vitals</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {records.vitals.map((vital) => (
                  <Card key={vital.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-foreground flex items-center">
                          <Heart className="w-4 h-4 mr-2 text-red-500" />
                          {vital.type}
                        </h4>
                        <span className="text-sm">{getTrendIcon(vital.trend)}</span>
                      </div>
                      <p className="text-2xl font-bold text-primary mb-1">{vital.value}</p>
                      <div className="flex items-center justify-between text-sm">
                        <Badge className={getStatusColor(vital.status)}>
                          {vital.status}
                        </Badge>
                        <span className="text-muted-foreground">{new Date(vital.date).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Lab Results Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Lab Results</h3>
              <div className="space-y-4">
                {records.labResults.map((lab) => (
                  <Card key={lab.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-foreground">{lab.testName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(lab.date).toLocaleDateString()} • {lab.provider}
                          </p>
                        </div>
                        <Badge className={getStatusColor(lab.status)}>
                          {lab.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(lab.results).map(([test, result]) => (
                          <div key={test} className="bg-muted p-3 rounded-lg">
                            <p className="text-sm font-medium">{test}</p>
                            <p className="text-sm text-muted-foreground">{result}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Document Storage</h3>
                <p className="text-muted-foreground mb-6">
                  Upload and manage your medical documents, images, and reports
                </p>
                <Button variant="outline" size="lg">
                  <Plus className="w-4 h-4 mr-2" />
                  Upload Document
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default HealthRecordsPage;