import {
  MessageCircle,
  Search,
  MoreVertical,
  Send,
  Paperclip,
  Smile,
  Home,
  Calendar,
  User,
  ChevronLeft,
  Image,
  FileText,
  Camera,
  Mic,
  X,
  UserPlus,
  Flag,
  Archive
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/supabaseClient";

const ProviderMessagesPage = () => {
  const navigate = useNavigate();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAttachments, setShowAttachments] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Real data states
  const [bookings, setBookings] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");

  // Modal state for patient profile, medical records, add record, and complete dialog
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showMedicalRecordsModal, setShowMedicalRecordsModal] = useState(false);
  const [showAddRecordModal, setShowAddRecordModal] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [consentLoading, setConsentLoading] = useState(false);
  const [addRecordLoading, setAddRecordLoading] = useState(false);
  const [completeLoading, setCompleteLoading] = useState(false);

  // Add record form state
  const [note, setNote] = useState("");
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [prescriptionInput, setPrescriptionInput] = useState({ medication: "", dosage: "", instruction: "" });

  // Medical records state
  const [medicalRecords, setMedicalRecords] = useState<any[]>([]);

  // For scroll to bottom on new message
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch tables separately
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);

      // Bookings for provider, only completed and in_progress
      const { data: bookingsData } = await supabase
        .from("bookings")
        .select("*")
        .eq("provider_id", user.id)
        .in("status", ["completed", "in_progress"]);
      setBookings(bookingsData || []);

      // Patients
      const { data: patientsData } = await supabase
        .from("patient_profiles")
        .select("*");
      setPatients(patientsData || []);

      setLoading(false);
    };
    fetchAll();
  }, []);

  // Fetch messages for selected chat and subscribe to realtime
  useEffect(() => {
    if (!selectedChat) return;
    const fetchMessages = async () => {
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("booking_id", selectedChat)
        .order("timestamp", { ascending: true });
      setMessages(msgs || []);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    };
    fetchMessages();

    // Supabase Realtime subscription for new messages
    const channel = supabase
      .channel('provider-messages-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `booking_id=eq.${selectedChat}`
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedChat]);

  // Merge patient info into bookings
  const threads = bookings.map(b => {
    const patient = patients.find(p => p.id === b.patient_id) || {};
    return {
      id: b.id,
      patient,
      date_time: b.date_time,
      status: b.status,
      reason: b.reason || ""
    };
  });

  // Fetch last message for each thread
  const [lastMessages, setLastMessages] = useState<{ [key: string]: any }>({});
  useEffect(() => {
    const fetchLastMessages = async () => {
      if (threads.length === 0) {
        setLastMessages({});
        return;
      }
      const ids = threads.map(t => t.id);
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .in("booking_id", ids)
        .order("timestamp", { ascending: false });
      // Get last message per booking_id
      const lastMsgMap: { [key: string]: any } = {};
      msgs?.forEach(msg => {
        if (!lastMsgMap[msg.booking_id]) {
          lastMsgMap[msg.booking_id] = msg;
        }
      });
      setLastMessages(lastMsgMap);
    };
    fetchLastMessages();
  }, [threads]);

  // Filter threads by search
  const filteredThreads = threads.filter(thread =>
    (thread.patient.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (thread.patient.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (thread.reason || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Fetch all medical records for the patient (not just this booking)
  useEffect(() => {
    const fetchMedicalRecords = async () => {
      if (!selectedChat) return;
      const booking = bookings.find(b => b.id === selectedChat);
      if (!booking || !booking.patient_id) return;
      const { data } = await supabase
        .from("medical_records")
        .select("*")
        .eq("patient_id", booking.patient_id)
        .order("created_at", { ascending: false });
      setMedicalRecords(data || []);
    };
    if (showMedicalRecordsModal && selectedChat) {
      fetchMedicalRecords();
    }
  }, [showMedicalRecordsModal, selectedChat, bookings]);

  // Send message
  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedChat) return;
    await supabase
      .from('messages')
      .insert({
        booking_id: selectedChat,
        sender_id: userId,
        text: messageInput,
        timestamp: new Date().toISOString()
      });
    setMessageInput("");
    // No need to refetch messages, realtime will handle update
  };

  // Consent request handler
  const handleConsentRequest = async (bookingId: string, patientId: string) => {
    setConsentLoading(true);
    // Update consent_granted to false (request sent)
    const { error } = await supabase
      .from("bookings")
      .update({ consent_granted: false })
      .eq("id", bookingId);

    // Send a message to the patient for approval
    await supabase
      .from("messages")
      .insert({
        booking_id: bookingId,
        sender_id: userId,
        text: "Provider has requested your consent to view your medical records. Please approve or decline.",
        timestamp: new Date().toISOString()
      });

    setConsentLoading(false);
    if (!error) {
      alert("Consent request sent to patient.");
    } else {
      alert("Failed to send consent request.");
    }
  };

  // Add prescription to list
  const handleAddPrescription = () => {
    if (
      prescriptionInput.medication.trim() &&
      prescriptionInput.dosage.trim() &&
      prescriptionInput.instruction.trim()
    ) {
      setPrescriptions([...prescriptions, { ...prescriptionInput }]);
      setPrescriptionInput({ medication: "", dosage: "", instruction: "" });
    }
  };

  // Remove prescription
  const handleRemovePrescription = (idx: number) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== idx));
  };

  // Submit medical record
  const handleAddRecord = async () => {
    if (!selectedChat || addRecordLoading) return;
    setAddRecordLoading(true);

    const thread = threads.find(t => t.id === selectedChat);
    await supabase
      .from("medical_records")
      .insert({
        booking_id: selectedChat,
        patient_id: thread.patient.id,
        provider_id: userId,
        notes: note,
        prescriptions: prescriptions,
        attachments: [], // Not implemented yet
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    // Optionally, send a message to chat
    await supabase
      .from("messages")
      .insert({
        booking_id: selectedChat,
        sender_id: userId,
        text: "A new medical record has been added.",
        timestamp: new Date().toISOString()
      });

    setAddRecordLoading(false);
    setShowAddRecordModal(false);
    setPrescriptions([]);
    setNote("");
    alert("Medical record added.");
  };

  // Mark booking as complete
  const handleMarkComplete = async () => {
    if (!selectedChat) return;
    setCompleteLoading(true);
    await supabase
      .from("bookings")
      .update({ status: "completed" })
      .eq("id", selectedChat);
    await supabase
      .from("messages")
      .insert({
        booking_id: selectedChat,
        sender_id: userId,
        text: "This session has been marked as complete by the provider.",
        timestamp: new Date().toISOString()
      });
    setCompleteLoading(false);
    setShowCompleteDialog(false);
    // Optionally, refresh bookings or UI state here
    // For immediate UI update:
    setBookings(prev =>
      prev.map(b =>
        b.id === selectedChat ? { ...b, status: "completed" } : b
      )
    );
  };

  if (selectedChat) {
    const thread = threads.find(t => t.id === selectedChat);
    const isCompleted = thread?.status === "completed";
    const patient = thread?.patient || {};
    const booking = bookings.find(b => b.id === selectedChat);
    const consentGranted = booking?.consent_granted;

    return (
      <div className="min-h-screen bg-gradient-subtle flex flex-col">
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-medical-blue to-medical-blue-dark text-white p-4 shadow-premium">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedChat(null)}
              className="text-white hover:bg-white/20 p-2"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-white/20 text-white text-sm font-bold">
                {(patient.name || "").split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="font-semibold font-display">{patient.name}</h2>
              <p className="text-white/80 text-sm">{patient.email}</p>
            </div>
            {/* Consent Request, Add Record, View Medical Records, Mark as Complete */}
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="bg-white text-primary border-primary shadow"
                disabled={consentGranted === true || consentLoading}
                onClick={() => handleConsentRequest(thread.id, patient.id)}
              >
                {consentGranted === true
                  ? "Consent Granted"
                  : consentLoading
                  ? "Requesting..."
                  : "Request Consent"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-white text-primary border-primary shadow"
                onClick={() => setShowAddRecordModal(true)}
              >
                Add Record
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-white text-primary border-primary shadow"
                disabled={!consentGranted}
                onClick={() => setShowMedicalRecordsModal(true)}
              >
                View Medical Records
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-white text-destructive border-destructive shadow"
                disabled={isCompleted}
                onClick={() => setShowCompleteDialog(true)}
              >
                Mark as Complete
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setShowProfileModal(true)}>
                    <User className="w-4 h-4 mr-2" />
                    View Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add to Contacts
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Archive className="w-4 h-4 mr-2" />
                    Archive Chat
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Flag className="w-4 h-4 mr-2" />
                    Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Mark as Complete Dialog */}
        <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mark Booking as Complete</DialogTitle>
            </DialogHeader>
            <div>
              <p>
                Are you sure you want to mark this booking as complete? This will end the chat session.
              </p>
            </div>
            <DialogFooter>
              <Button
                onClick={handleMarkComplete}
                disabled={completeLoading}
                className="bg-destructive text-white"
              >
                {completeLoading ? "Completing..." : "Yes, Complete"}
              </Button>
              <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Medical Record Modal */}
        <Dialog open={showAddRecordModal} onOpenChange={setShowAddRecordModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Medical Record</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block font-semibold mb-1">Notes</label>
                <Textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Enter notes about the patient's condition, diagnosis, etc."
                  rows={3}
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Prescriptions</label>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Medication"
                    value={prescriptionInput.medication}
                    onChange={e => setPrescriptionInput({ ...prescriptionInput, medication: e.target.value })}
                  />
                  <Input
                    placeholder="Dosage"
                    value={prescriptionInput.dosage}
                    onChange={e => setPrescriptionInput({ ...prescriptionInput, dosage: e.target.value })}
                  />
                  <Input
                    placeholder="Instruction"
                    value={prescriptionInput.instruction}
                    onChange={e => setPrescriptionInput({ ...prescriptionInput, instruction: e.target.value })}
                  />
                  <Button type="button" onClick={handleAddPrescription} className="bg-primary text-white">
                    Add
                  </Button>
                </div>
                <div className="space-y-1">
                  {prescriptions.map((presc, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-muted px-2 py-1 rounded">
                      <span className="font-medium">{presc.medication}</span>
                      <span className="text-xs text-muted-foreground">{presc.dosage}</span>
                      <span className="text-xs text-muted-foreground">{presc.instruction}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemovePrescription(idx)}
                        className="text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Attachments</label>
                <Input
                  type="file"
                  multiple
                  disabled
                  className="bg-white"
                />
                <div className="mt-2 text-xs text-muted-foreground">
                  (File upload not implemented yet)
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleAddRecord}
                disabled={addRecordLoading}
                className="bg-primary text-white"
              >
                {addRecordLoading ? "Saving..." : "Save Record"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddRecordModal(false)}
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Patient Profile Modal */}
        <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Patient Profile</DialogTitle>
            </DialogHeader>
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="bg-medical-blue text-white text-xl font-bold">
                  {(patient.name || "P").split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold text-lg">{patient.name}</div>
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <span className="font-semibold">Date of Birth:</span>{" "}
                {patient.date_of_birth || <span className="text-muted-foreground">N/A</span>}
              </div>
              <div>
                <span className="font-semibold">Blood Group:</span>{" "}
                {patient.blood_type || <span className="text-muted-foreground">N/A</span>}
              </div>
              <div>
                <span className="font-semibold">Allergies:</span>{" "}
                {patient.allergies || <span className="text-muted-foreground">N/A</span>}
              </div>
              <div>
                <span className="font-semibold">Current Condition:</span>{" "}
                {patient.conditions || <span className="text-muted-foreground">N/A</span>}
              </div>
              <div>
                <span className="font-semibold">Gender:</span>{" "}
                {patient.gender || <span className="text-muted-foreground">N/A</span>}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowProfileModal(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Medical Records Modal */}
        <Dialog open={showMedicalRecordsModal} onOpenChange={setShowMedicalRecordsModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Medical Records</DialogTitle>
            </DialogHeader>
            <div>
              {!consentGranted ? (
                <p className="text-muted-foreground">You do not have consent to view this patient's medical records.</p>
              ) : medicalRecords.length === 0 ? (
                <p className="text-muted-foreground">No medical records found for this patient.</p>
              ) : (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                  {medicalRecords.map((record, idx) => (
                    <Card key={record.id} className="p-4">
                      <div className="mb-2">
                        <span className="font-semibold">Date:</span>{" "}
                        {record.created_at
                          ? new Date(record.created_at).toLocaleDateString()
                          : ""}
                      </div>
                      <div className="mb-2">
                        <span className="font-semibold">Notes:</span>{" "}
                        {record.notes || <span className="text-muted-foreground">N/A</span>}
                      </div>
                      {Array.isArray(record.prescriptions) && record.prescriptions.length > 0 && (
                        <div className="mb-2">
                          <span className="font-semibold">Prescriptions:</span>
                          <ul className="mt-2 space-y-2">
                            {record.prescriptions.map((presc: any, idx: number) => (
                              <li key={idx} className="border-b pb-2">
                                <div>
                                  <span className="font-medium">{presc.medication}</span>
                                </div>
                                <div className="text-sm">
                                  <span className="font-semibold">Dosage:</span> {presc.dosage}
                                </div>
                                <div className="text-sm">
                                  <span className="font-semibold">Instruction:</span> {presc.instruction}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {Array.isArray(record.attachments) && record.attachments.length > 0 && (
                        <div className="mb-2">
                          <span className="font-semibold">Attachments:</span>
                          <ul className="mt-2 space-y-1">
                            {record.attachments.map((file: string, idx: number) => (
                              <li key={idx}>
                                <a
                                  href={file}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 underline"
                                >
                                  {file.split("/").pop()}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setShowMedicalRecordsModal(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => {
              const isMe = message.sender_id === userId;
              const senderName = isMe ? "Me" : patient.name || "Patient";
              return (
                <div
                  key={message.id}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div className="flex items-end space-x-2 max-w-[80%]">
                    {!isMe && (
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-medical-blue text-white text-xs font-bold">
                          {senderName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`p-3 rounded-2xl ${
                        isMe
                          ? "bg-primary text-primary-foreground"
                          : "bg-card border border-border text-card-foreground"
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className={`text-xs ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                        </span>
                        <span className="text-xs ml-2 font-semibold">{senderName}</span>
                      </div>
                    </div>
                    {isMe && (
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-primary text-white text-xs font-bold">
                          Me
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="p-4 bg-white border-t border-border">
          {showAttachments && !isCompleted && (
            <div className="mb-4 p-4 bg-muted/50 rounded-lg">
              <div className="grid grid-cols-4 gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex flex-col h-16 space-y-1"
                  onClick={() => setShowAttachments(false)}
                  disabled={isCompleted}
                >
                  <Camera className="w-5 h-5" />
                  <span className="text-xs">Camera</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex flex-col h-16 space-y-1"
                  onClick={() => setShowAttachments(false)}
                  disabled={isCompleted}
                >
                  <Image className="w-5 h-5" />
                  <span className="text-xs">Photo</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex flex-col h-16 space-y-1"
                  onClick={() => setShowAttachments(false)}
                  disabled={isCompleted}
                >
                  <FileText className="w-5 h-5" />
                  <span className="text-xs">Document</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex flex-col h-16 space-y-1"
                  onClick={() => setShowAttachments(false)}
                  disabled={isCompleted}
                >
                  <X className="w-5 h-5" />
                  <span className="text-xs">Cancel</span>
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setShowAttachments(!showAttachments)}
              disabled={isCompleted}
            >
              <Paperclip className="w-5 h-5" />
            </Button>
            <Input
              placeholder={isCompleted ? "Chat closed for completed appointments" : "Type your message..."}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => !isCompleted && e.key === 'Enter' && sendMessage()}
              className="flex-1"
              disabled={isCompleted}
            />
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => {}}
              disabled={isCompleted}
            >
              <Smile className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`text-muted-foreground hover:text-foreground ${isRecording ? 'text-destructive bg-destructive/10' : ''}`}
              onClick={() => !isCompleted && setIsRecording(!isRecording)}
              disabled={isCompleted}
            >
              <Mic className={`w-5 h-5 ${isRecording ? 'animate-pulse' : ''}`} />
            </Button>
            <Button
              onClick={sendMessage}
              disabled={!messageInput.trim() || isCompleted}
              className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-medical-blue to-medical-blue-dark text-white p-6 rounded-b-3xl shadow-premium">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold font-display">Messages</h1>
            <p className="text-white/90 text-sm font-body">Chat with your patients</p>
          </div>
          <div className="relative">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
        </div>
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/20 border-white/30 text-white placeholder-white/70 focus:bg-white/25"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white hover:bg-white/20 h-6 w-6 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="text-center text-muted-foreground">Loading conversations...</div>
        ) : (
          <div className="space-y-3">
            {(searchQuery ? filteredThreads : threads).map((thread) => {
              const lastMsg = lastMessages[thread.id];
              return (
                <Card
                  key={thread.id}
                  className="p-4 hover:shadow-card transition-all duration-300 cursor-pointer"
                  onClick={() => setSelectedChat(thread.id)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                          {(thread.patient.name || "").split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-medical-green rounded-full border-2 border-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-foreground font-display truncate">
                          {thread.patient.name}
                        </h3>
                        <span className="text-xs text-muted-foreground">
                          {thread.date_time ? new Date(thread.date_time).toLocaleDateString() : ""}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-sm mb-1">
                        {thread.patient.email}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground truncate flex-1">
                          {thread.status}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        <span className="font-semibold">Reason:</span> {thread.reason}
                      </p>
                      {lastMsg && (
                        <div className="flex items-center mt-2 text-xs text-muted-foreground">
                          <Avatar className="w-6 h-6 mr-2">
                            <AvatarFallback className="bg-muted text-muted-foreground text-xs font-bold">
                              {lastMsg.sender_id === userId ? "Me" : (thread.patient.name || "P").split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate">{lastMsg.text}</span>
                          <span className="ml-2">{lastMsg.timestamp ? new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
            {searchQuery && filteredThreads.length === 0 && (
              <Card className="p-8 text-center">
                <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-medium text-foreground mb-2">No conversations found</h3>
                <p className="text-sm text-muted-foreground">Try searching with different keywords</p>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border shadow-premium">
        <div className="flex justify-around py-3">
          {[
            { icon: Home, label: 'Home', active: false, route: '/provider-dashboard' },
            { icon: Calendar, label: 'Schedule', active: false, route: '/provider-schedule' },
            { icon: MessageCircle, label: 'Messages', active: true, route: '/provider-messages' },
            { icon: User, label: 'Profile', active: false, route: '/provider-profile' }
          ].map((item, index) => (
            <button
              key={index}
              onClick={() => navigate(item.route)}
              className={`flex flex-col items-center py-2 px-4 transition-colors ${
                item.active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <item.icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-body">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProviderMessagesPage;