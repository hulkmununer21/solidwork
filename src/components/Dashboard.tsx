import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Heart, MessageCircle, User, Bell } from "lucide-react";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-blue-light to-white">
      <div className="bg-white shadow-card p-6 pt-16">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold font-display text-foreground">Good Morning</h1>
            <p className="text-muted-foreground font-body">How are you feeling today?</p>
          </div>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-medical-blue" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-medical-green rounded-full"></div>
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
          <CardContent className="p-6 text-center">
            <h3 className="font-bold text-lg mb-2">Emergency Help</h3>
            <Button variant="outline" className="bg-white text-red-600">Call Now</Button>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-xl font-bold mb-4 font-display text-foreground">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Calendar, label: 'Book Appointment', color: 'bg-medical-blue' },
              { icon: MessageCircle, label: 'Chat with Doctor', color: 'bg-medical-green' }
            ].map((action, i) => (
              <Card key={i} className="cursor-pointer hover:shadow-premium transition-premium border-0 shadow-card">
                <CardContent className="p-6 text-center">
                  <div className={`${action.color} rounded-2xl p-4 w-16 h-16 mx-auto mb-3 shadow-premium`}>
                    <action.icon className="h-8 w-8 text-white mx-auto" />
                  </div>
                  <p className="font-medium text-foreground font-body">{action.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-premium p-4">
        <div className="flex justify-around">
          {[
            { icon: Heart, active: true, label: 'Home' },
            { icon: Calendar, active: false, label: 'Appointments' },
            { icon: MessageCircle, active: false, label: 'Messages' },
            { icon: User, active: false, label: 'Profile' }
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <item.icon className={`h-6 w-6 ${item.active ? 'text-medical-blue' : 'text-muted-foreground'}`} />
              <span className={`text-xs font-body ${item.active ? 'text-medical-blue font-semibold' : 'text-muted-foreground'}`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;