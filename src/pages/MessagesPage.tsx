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
import html2canvas from "html2canvas";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/supabaseClient";

const MessagesPage = () => {
  const navigate = useNavigate();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAttachments, setShowAttachments] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Consent modal state
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentLoading, setConsentLoading] = useState(false);

  // Medical records state
  const [medicalRecords, setMedicalRecords] = useState<any[]>([]);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [prescriptionRecord, setPrescriptionRecord] = useState<any>(null);

  // Real data states
  const [bookings, setBookings] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");

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

      // Bookings for patient, only completed and in_progress
      const { data: bookingsData } = await supabase
        .from("bookings")
        .select("*")
        .eq("patient_id", user.id)
        .in("status", ["completed", "in_progress"]);
      setBookings(bookingsData || []);

      // Providers
      const { data: providersData } = await supabase
        .from("provider_profiles")
        .select("*");
      setProviders(providersData || []);

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
      .channel('patient-messages-realtime')
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

  // Fetch medical records for selected chat
  useEffect(() => {
    const fetchMedicalRecords = async () => {
      if (!selectedChat) return;
      const { data } = await supabase
        .from("medical_records")
        .select("*")
        .eq("booking_id", selectedChat)
        .order("created_at", { ascending: false });
      setMedicalRecords(data || []);
    };
    fetchMedicalRecords();
  }, [selectedChat]);

  // Merge provider info into bookings
  const threads = bookings.map(b => {
    const provider = providers.find(p => p.id === b.provider_id) || {};
    return {
      id: b.id,
      provider,
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
    (thread.provider.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (thread.provider.specialty || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (thread.reason || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Consent request detection
  const booking = bookings.find(b => b.id === selectedChat);
  const consentRequested = booking && booking.consent_granted === false;
  const consentGranted = booking && booking.consent_granted === true;

  // Accept consent handler
  const handleAcceptConsent = async () => {
    if (!selectedChat) return;
    setConsentLoading(true);
    await supabase
      .from("bookings")
      .update({ consent_granted: true })
      .eq("id", selectedChat);
    await supabase
      .from("messages")
      .insert({
        booking_id: selectedChat,
        sender_id: userId,
        text: "Patient has granted consent for medical records access.",
        timestamp: new Date().toISOString()
      });
    setConsentLoading(false);
    setShowConsentModal(false);
  };

  // Reject consent handler
  const handleRejectConsent = async () => {
    if (!selectedChat) return;
    setConsentLoading(true);
    await supabase
      .from("bookings")
      .update({ consent_granted: null })
      .eq("id", selectedChat);
    await supabase
      .from("messages")
      .insert({
        booking_id: selectedChat,
        sender_id: userId,
        text: "Patient has rejected consent for medical records access.",
        timestamp: new Date().toISOString()
      });
    setConsentLoading(false);
    setShowConsentModal(false);
  };

  // Show consent modal if consent is requested and not yet granted
  useEffect(() => {
    if (consentRequested && !consentGranted) {
      setShowConsentModal(true);
    } else {
      setShowConsentModal(false);
    }
  }, [consentRequested, consentGranted, selectedChat]);

  // Prescription modal handlers
  const handleViewPrescription = (record: any) => {
    setPrescriptionRecord(record);
    setShowPrescriptionModal(true);
  };

  const handleDownloadPrescriptionImage = () => {
    const element = document.getElementById("prescription-card");
    if (element) {
      html2canvas(element).then(canvas => {
        const link = document.createElement("a");
        link.download = "prescription.png";
        link.href = canvas.toDataURL();
        link.click();
      });
    }
  };

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

  if (selectedChat) {
    const thread = threads.find(t => t.id === selectedChat);
    const isCompleted = thread?.status === "completed";
    const providerName = thread?.provider.name || "Provider";

    return (
      <div className="min-h-screen bg-gradient-subtle flex flex-col">
        {/* Consent Modal */}
        <Dialog open={showConsentModal} onOpenChange={setShowConsentModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Consent Request</DialogTitle>
            </DialogHeader>
            <div className="mb-4">
              <p>
                Your provider <span className="font-semibold">{thread?.provider.name}</span> is requesting your consent to view your medical records for this appointment.
              </p>
              <p className="mt-2 text-muted-foreground text-sm">
                You can accept or reject this request.
              </p>
            </div>
            <DialogFooter>
              <Button
                onClick={handleAcceptConsent}
                disabled={consentLoading}
                className="bg-medical-green text-white"
              >
                {consentLoading ? "Processing..." : "Accept"}
              </Button>
              <Button
                variant="outline"
                onClick={handleRejectConsent}
                disabled={consentLoading}
              >
                {consentLoading ? "Processing..." : "Reject"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Prescription Modal */}
        <Dialog open={showPrescriptionModal} onOpenChange={setShowPrescriptionModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Prescription</DialogTitle>
            </DialogHeader>
            {prescriptionRecord && (
              <div>
                <div
                  id="prescription-card"
                  className="bg-white rounded-lg shadow p-6 mb-4"
                  style={{ maxWidth: 400, margin: "0 auto" }}
                >
                  <div className="text-center mb-2">
                    <span className="font-bold text-lg text-primary">AHS Africa</span>
                  </div>
                  <div className="mb-2 text-center">
                    <span className="font-semibold">Provider:</span>{" "}
                    <span>{providerName}</span>
                  </div>
                  <div className="mb-2">
                    <span className="font-semibold">Date:</span>{" "}
                    {prescriptionRecord.created_at
                      ? new Date(prescriptionRecord.created_at).toLocaleDateString()
                      : ""}
                  </div>
                  <div>
                    <span className="font-semibold">Prescriptions:</span>
                    <ul className="mt-2 space-y-2">
                      {Array.isArray(prescriptionRecord.prescriptions) &&
                        prescriptionRecord.prescriptions.map((presc: any, idx: number) => (
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
                </div>
                <DialogFooter>
                  <Button
                    className="bg-primary text-white"
                    onClick={handleDownloadPrescriptionImage}
                  >
                    Download as Image
                  </Button>
                  <Button variant="outline" onClick={() => setShowPrescriptionModal(false)}>
                    Close
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

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
                {(thread?.provider.name || "").split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="font-semibold font-display">{thread?.provider.name}</h2>
              <p className="text-white/80 text-sm">{thread?.provider.specialty}</p>
            </div>
            <div className="flex space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem>
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

        {/* Medical Records Section */}
        {consentGranted && medicalRecords.length > 0 && (
          <div className="p-4">
            <h3 className="font-semibold mb-2">Medical Records</h3>
            {medicalRecords.map((record, idx) => (
              <Card key={record.id} className="mb-4 p-4">
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
                    <Button
                      className="mt-2 bg-primary text-white"
                      onClick={() => handleViewPrescription(record)}
                    >
                      View & Download Prescription
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => {
              const isMe = message.sender_id === userId;
              const senderName = isMe ? "Me" : thread?.provider.name || "Provider";
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
            <p className="text-white/90 text-sm font-body">Chat with your healthcare providers</p>
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
                          {(thread.provider.name || "").split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-medical-green rounded-full border-2 border-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-foreground font-display truncate">
                          {thread.provider.name}
                        </h3>
                        <span className="text-xs text-muted-foreground">
                          {thread.date_time ? new Date(thread.date_time).toLocaleDateString() : ""}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-sm mb-1">
                        {thread.provider.specialty}
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
                              {lastMsg.sender_id === userId ? "Me" : (thread.provider.name || "P").split(' ').map(n => n[0]).join('')}
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
            { icon: Home, label: 'Home', active: false, route: '/dashboard' },
            { icon: Calendar, label: 'Bookings', active: false, route: '/bookings' },
            { icon: MessageCircle, label: 'Messages', active: true, route: '/messages' },
            { icon: User, label: 'Profile', active: false, route: '/profile' }
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

export default MessagesPage;