import { useState } from "react";
import { Heart, Utensils, Moon, Activity, TrendingUp, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface LifestyleData {
  diet: { meals: number; water: number; date: string };
  sleep: { hours: number; quality: number; date: string };
  exercise: { minutes: number; type: string; date: string };
}

export const LifestyleTracking = () => {
  const { toast } = useToast();
  const [lifestyleData, setLifestyleData] = useState<LifestyleData>({
    diet: { meals: 0, water: 0, date: new Date().toDateString() },
    sleep: { hours: 0, quality: 0, date: new Date().toDateString() },
    exercise: { minutes: 0, type: "", date: new Date().toDateString() }
  });

  // Mock historical data
  const weeklyData = {
    sleep: [7, 6.5, 8, 7.5, 6, 7, 8],
    water: [6, 8, 7, 9, 5, 8, 10],
    exercise: [30, 0, 45, 30, 0, 60, 45]
  };

  const handleUpdateLifestyle = (category: keyof LifestyleData, field: string, value: any) => {
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
      title: "Data Saved",
      description: `Your ${category} data has been recorded successfully.`
    });
  };

  const getDailyGoals = () => ({
    water: 8, // glasses
    sleep: 8, // hours
    exercise: 30 // minutes
  });

  const goals = getDailyGoals();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground font-display">Lifestyle Tracking</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Daily Progress Cards */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center">
              <Heart className="w-4 h-4 mr-2 text-red-500" />
              Water Intake
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{lifestyleData.diet.water} / {goals.water} glasses</span>
                <span>{Math.round((lifestyleData.diet.water / goals.water) * 100)}%</span>
              </div>
              <Progress value={(lifestyleData.diet.water / goals.water) * 100} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center">
              <Moon className="w-4 h-4 mr-2 text-blue-500" />
              Sleep Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{lifestyleData.sleep.hours} / {goals.sleep} hours</span>
                <span>{Math.round((lifestyleData.sleep.hours / goals.sleep) * 100)}%</span>
              </div>
              <Progress value={(lifestyleData.sleep.hours / goals.sleep) * 100} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center">
              <Activity className="w-4 h-4 mr-2 text-green-500" />
              Exercise
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{lifestyleData.exercise.minutes} / {goals.exercise} min</span>
                <span>{Math.round((lifestyleData.exercise.minutes / goals.exercise) * 100)}%</span>
              </div>
              <Progress value={(lifestyleData.exercise.minutes / goals.exercise) * 100} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="diet" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="diet">Diet & Nutrition</TabsTrigger>
          <TabsTrigger value="sleep">Sleep</TabsTrigger>
          <TabsTrigger value="exercise">Exercise</TabsTrigger>
        </TabsList>

        <TabsContent value="diet" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Utensils className="w-5 h-5 mr-2" />
                Today's Nutrition
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
                  placeholder="Number of meals"
                />
              </div>
              <div>
                <Label htmlFor="water">Water intake (glasses)</Label>
                <Input
                  id="water"
                  type="number"
                  value={lifestyleData.diet.water}
                  onChange={(e) => handleUpdateLifestyle('diet', 'water', parseInt(e.target.value) || 0)}
                  placeholder="Glasses of water"
                />
              </div>
              <Button onClick={() => handleSaveData('diet')}>Save Diet Data</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sleep" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Moon className="w-5 h-5 mr-2" />
                Sleep Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="sleep-hours">Hours of sleep</Label>
                <Input
                  id="sleep-hours"
                  type="number"
                  step="0.5"
                  value={lifestyleData.sleep.hours}
                  onChange={(e) => handleUpdateLifestyle('sleep', 'hours', parseFloat(e.target.value) || 0)}
                  placeholder="Hours slept"
                />
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
                  placeholder="Rate your sleep quality"
                />
              </div>
              <Button onClick={() => handleSaveData('sleep')}>Save Sleep Data</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exercise" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Exercise Log
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="exercise-type">Exercise type</Label>
                <Input
                  id="exercise-type"
                  value={lifestyleData.exercise.type}
                  onChange={(e) => handleUpdateLifestyle('exercise', 'type', e.target.value)}
                  placeholder="Walking, Running, Gym, etc."
                />
              </div>
              <div>
                <Label htmlFor="exercise-minutes">Duration (minutes)</Label>
                <Input
                  id="exercise-minutes"
                  type="number"
                  value={lifestyleData.exercise.minutes}
                  onChange={(e) => handleUpdateLifestyle('exercise', 'minutes', parseInt(e.target.value) || 0)}
                  placeholder="Exercise duration"
                />
              </div>
              <Button onClick={() => handleSaveData('exercise')}>Save Exercise Data</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Weekly Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Weekly Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium mb-2">Sleep Average</h4>
              <p className="text-2xl font-bold text-primary">
                {(weeklyData.sleep.reduce((a, b) => a + b, 0) / 7).toFixed(1)}h
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Water Average</h4>
              <p className="text-2xl font-bold text-blue-500">
                {(weeklyData.water.reduce((a, b) => a + b, 0) / 7).toFixed(1)} glasses
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Exercise Total</h4>
              <p className="text-2xl font-bold text-green-500">
                {weeklyData.exercise.reduce((a, b) => a + b, 0)} min
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};