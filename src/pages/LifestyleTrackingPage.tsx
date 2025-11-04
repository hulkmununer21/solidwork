import { useState } from "react";
import { ArrowLeft, Heart, Utensils, Moon, Activity, TrendingUp, Calendar, Award, Target, Plus, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const LifestyleTrackingPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [lifestyleData, setLifestyleData] = useState({
    diet: { meals: 3, water: 7, calories: 1850, date: new Date().toDateString() },
    sleep: { hours: 7.5, quality: 8, date: new Date().toDateString() },
    exercise: { minutes: 45, type: "Cardio", calories: 320, date: new Date().toDateString() },
    mood: { rating: 8, notes: "", date: new Date().toDateString() }
  });

  // Enhanced mock data
  const weeklyData = {
    sleep: [7.2, 6.8, 8.1, 7.5, 6.5, 7.8, 8.2],
    water: [6, 8, 7, 9, 5, 8, 10],
    exercise: [30, 45, 0, 60, 45, 0, 90],
    mood: [7, 8, 6, 9, 7, 8, 8]
  };

  const monthlyStats = {
    avgSleep: 7.4,
    avgWater: 7.5,
    totalExercise: 285,
    avgMood: 7.6,
    streaks: {
      sleep: 5,
      water: 12,
      exercise: 3,
      mood: 8
    }
  };

  const goals = {
    water: 8, // glasses
    sleep: 8, // hours
    exercise: 150, // minutes per week
    steps: 10000 // daily steps
  };

  const achievements = [
    { id: 1, title: "Hydration Hero", description: "Reached water goal 7 days in a row", icon: "💧", unlocked: true },
    { id: 2, title: "Early Bird", description: "Consistent sleep schedule for 5 days", icon: "🌅", unlocked: true },
    { id: 3, title: "Workout Warrior", description: "Exercise 5 times this week", icon: "💪", unlocked: false },
    { id: 4, title: "Mood Master", description: "Maintain positive mood for 10 days", icon: "😊", unlocked: true }
  ];

  const handleUpdateLifestyle = (category: keyof typeof lifestyleData, field: string, value: any) => {
    setLifestyleData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
        date: new Date().toDateString()
      }
    }));
  };

  const handleSaveData = (category: string) => {
    toast({
      title: "Progress Saved",
      description: `Your ${category} data has been recorded successfully!`
    });
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return "bg-green-500";
    if (percentage >= 75) return "bg-yellow-500";
    return "bg-blue-500";
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white p-6">
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
            <h1 className="text-3xl font-bold font-display">Lifestyle Tracking</h1>
            <p className="text-white/90">Monitor your daily wellness journey</p>
          </div>
        </div>

        {/* Daily Progress Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4 text-center">
              <Heart className="w-6 h-6 mx-auto mb-2 text-red-300" />
              <div className="flex justify-between text-sm mb-1">
                <span>{lifestyleData.diet.water} / {goals.water}</span>
                <span>{Math.round((lifestyleData.diet.water / goals.water) * 100)}%</span>
              </div>
              <Progress value={(lifestyleData.diet.water / goals.water) * 100} className="h-2" />
              <p className="text-white/90 text-xs mt-1">Water Goal</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4 text-center">
              <Moon className="w-6 h-6 mx-auto mb-2 text-blue-300" />
              <div className="flex justify-between text-sm mb-1">
                <span>{lifestyleData.sleep.hours}h / {goals.sleep}h</span>
                <span>{Math.round((lifestyleData.sleep.hours / goals.sleep) * 100)}%</span>
              </div>
              <Progress value={(lifestyleData.sleep.hours / goals.sleep) * 100} className="h-2" />
              <p className="text-white/90 text-xs mt-1">Sleep Goal</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4 text-center">
              <Activity className="w-6 h-6 mx-auto mb-2 text-orange-300" />
              <div className="flex justify-between text-sm mb-1">
                <span>{lifestyleData.exercise.minutes}min</span>
                <span>{lifestyleData.exercise.calories} cal</span>
              </div>
              <Progress value={(lifestyleData.exercise.minutes / 60) * 100} className="h-2" />
              <p className="text-white/90 text-xs mt-1">Exercise Today</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4 text-center">
              <Target className="w-6 h-6 mx-auto mb-2 text-purple-300" />
              <p className="text-2xl font-bold">{lifestyleData.mood.rating}/10</p>
              <p className="text-white/90 text-xs">Mood Score</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4 mb-6">
          <Button variant="default" size="lg" className="gradient-premium text-white">
            <Plus className="w-4 h-4 mr-2" />
            Quick Log
          </Button>
          <Button variant="outline" size="lg">
            <BarChart3 className="w-4 h-4 mr-2" />
            View Analytics
          </Button>
          <Button variant="outline" size="lg">
            <Award className="w-4 h-4 mr-2" />
            Achievements
          </Button>
        </div>

        <Tabs defaultValue="today" className="w-full">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="today">Today's Log</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nutrition */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Utensils className="w-5 h-5 mr-2 text-orange-600" />
                    Nutrition & Hydration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="meals">Meals completed today</Label>
                    <Input
                      id="meals"
                      type="number"
                      value={lifestyleData.diet.meals}
                      onChange={(e) => handleUpdateLifestyle('diet', 'meals', parseInt(e.target.value) || 0)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="water">Water intake (glasses)</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Input
                        id="water"
                        type="number"
                        value={lifestyleData.diet.water}
                        onChange={(e) => handleUpdateLifestyle('diet', 'water', parseInt(e.target.value) || 0)}
                      />
                      <span className="text-sm text-muted-foreground">/ {goals.water}</span>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="calories">Estimated calories</Label>
                    <Input
                      id="calories"
                      type="number"
                      value={lifestyleData.diet.calories}
                      onChange={(e) => handleUpdateLifestyle('diet', 'calories', parseInt(e.target.value) || 0)}
                      className="mt-1"
                    />
                  </div>
                  <Button onClick={() => handleSaveData('nutrition')} className="w-full">
                    Save Nutrition Data
                  </Button>
                </CardContent>
              </Card>

              {/* Sleep */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Moon className="w-5 h-5 mr-2 text-blue-600" />
                    Sleep Tracking
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="sleep-hours">Hours of sleep</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Input
                        id="sleep-hours"
                        type="number"
                        step="0.5"
                        value={lifestyleData.sleep.hours}
                        onChange={(e) => handleUpdateLifestyle('sleep', 'hours', parseFloat(e.target.value) || 0)}
                      />
                      <span className="text-sm text-muted-foreground">/ {goals.sleep}h</span>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="sleep-quality">Sleep quality (1-10)</Label>
                    <Input
                      id="sleep-quality"
                      type="number"
                      min="1"
                      max="10"
                      value={lifestyleData.sleep.quality}
                      onChange={(e) => handleUpdateLifestyle('sleep', 'quality', parseInt(e.target.value) || 0)}
                      className="mt-1"
                    />
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Sleep Analysis</h4>
                    <p className="text-sm text-blue-700">
                      {lifestyleData.sleep.hours >= 7 ? "Great! You're getting adequate sleep." : "Try to aim for 7-9 hours of sleep."}
                    </p>
                  </div>
                  <Button onClick={() => handleSaveData('sleep')} className="w-full">
                    Save Sleep Data
                  </Button>
                </CardContent>
              </Card>

              {/* Exercise */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-green-600" />
                    Exercise & Movement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="exercise-type">Activity type</Label>
                    <Input
                      id="exercise-type"
                      value={lifestyleData.exercise.type}
                      onChange={(e) => handleUpdateLifestyle('exercise', 'type', e.target.value)}
                      placeholder="Cardio, Strength, Yoga, Walking..."
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="exercise-minutes">Duration (minutes)</Label>
                    <Input
                      id="exercise-minutes"
                      type="number"
                      value={lifestyleData.exercise.minutes}
                      onChange={(e) => handleUpdateLifestyle('exercise', 'minutes', parseInt(e.target.value) || 0)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="exercise-calories">Calories burned</Label>
                    <Input
                      id="exercise-calories"
                      type="number"
                      value={lifestyleData.exercise.calories}
                      onChange={(e) => handleUpdateLifestyle('exercise', 'calories', parseInt(e.target.value) || 0)}
                      className="mt-1"
                    />
                  </div>
                  <Button onClick={() => handleSaveData('exercise')} className="w-full">
                    Save Exercise Data
                  </Button>
                </CardContent>
              </Card>

              {/* Mood & Wellness */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Heart className="w-5 h-5 mr-2 text-red-600" />
                    Mood & Wellness
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="mood-rating">Overall mood (1-10)</Label>
                    <Input
                      id="mood-rating"
                      type="number"
                      min="1"
                      max="10"
                      value={lifestyleData.mood.rating}
                      onChange={(e) => handleUpdateLifestyle('mood', 'rating', parseInt(e.target.value) || 0)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mood-notes">Notes (optional)</Label>
                    <textarea
                      id="mood-notes"
                      value={lifestyleData.mood.notes}
                      onChange={(e) => handleUpdateLifestyle('mood', 'notes', e.target.value)}
                      placeholder="How are you feeling today? Any thoughts or observations..."
                      className="w-full mt-1 p-3 border border-border rounded-md resize-none"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {['😊', '😐', '😔'].map((emoji, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateLifestyle('mood', 'rating', [8, 5, 3][index])}
                        className="text-lg"
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                  <Button onClick={() => handleSaveData('mood')} className="w-full">
                    Save Mood Data
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            {/* Weekly Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Weekly Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-4">Sleep Pattern (Hours)</h4>
                    <div className="space-y-2">
                      {weeklyData.sleep.map((hours, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}</span>
                          <div className="flex items-center space-x-2">
                            <Progress value={(hours / 10) * 100} className="w-24 h-2" />
                            <span className="text-sm font-medium w-10">{hours}h</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-4">Exercise Minutes</h4>
                    <div className="space-y-2">
                      {weeklyData.exercise.map((minutes, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}</span>
                          <div className="flex items-center space-x-2">
                            <Progress value={(minutes / 90) * 100} className="w-24 h-2" />
                            <span className="text-sm font-medium w-12">{minutes}m</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Moon className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <p className="text-2xl font-bold text-blue-800">{monthlyStats.avgSleep}h</p>
                    <p className="text-sm text-blue-600">Avg Sleep</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Activity className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <p className="text-2xl font-bold text-green-800">{monthlyStats.totalExercise}m</p>
                    <p className="text-sm text-green-600">Total Exercise</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Heart className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                    <p className="text-2xl font-bold text-purple-800">{monthlyStats.avgMood}/10</p>
                    <p className="text-sm text-purple-600">Avg Mood</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <Utensils className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                    <p className="text-2xl font-bold text-orange-800">{monthlyStats.avgWater}</p>
                    <p className="text-sm text-orange-600">Avg Water</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="goals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Personal Goals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Daily Goals</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span>Water intake</span>
                        <span className="font-medium">{goals.water} glasses</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Sleep duration</span>
                        <span className="font-medium">{goals.sleep} hours</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Daily steps</span>
                        <span className="font-medium">{goals.steps.toLocaleString()} steps</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-medium">Weekly Goals</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span>Exercise time</span>
                        <span className="font-medium">{goals.exercise} minutes</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Mood tracking</span>
                        <span className="font-medium">7 days</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Button className="w-full gradient-premium text-white">
                  Update Goals
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map((achievement) => (
                <Card key={achievement.id} className={`${achievement.unlocked ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200' : 'bg-muted'}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="text-4xl">
                        {achievement.unlocked ? achievement.icon : '🔒'}
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-semibold ${achievement.unlocked ? 'text-yellow-800' : 'text-muted-foreground'}`}>
                          {achievement.title}
                        </h3>
                        <p className={`text-sm ${achievement.unlocked ? 'text-yellow-700' : 'text-muted-foreground'}`}>
                          {achievement.description}
                        </p>
                      </div>
                      {achievement.unlocked && (
                        <Badge className="bg-yellow-500 text-white">
                          Unlocked!
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LifestyleTrackingPage;