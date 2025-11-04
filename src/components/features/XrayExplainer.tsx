import { useState } from "react";
import { Upload, FileImage, Brain, AlertTriangle, Download, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface XrayAnalysis {
  id: string;
  filename: string;
  uploadDate: string;
  status: 'analyzing' | 'completed' | 'error';
  findings: string[];
  explanation: string;
  recommendations: string[];
  confidence: number;
}

export const XrayExplainer = () => {
  const { toast } = useToast();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [analyses, setAnalyses] = useState<XrayAnalysis[]>([
    {
      id: '1',
      filename: 'chest_xray_20240115.jpg',
      uploadDate: '2024-01-15',
      status: 'completed',
      findings: ['Normal lung fields', 'Heart size within normal limits', 'No acute abnormalities'],
      explanation: 'This chest X-ray shows healthy lungs with clear lung fields and no signs of infection, fluid, or masses. The heart appears normal in size and position. The bones and soft tissues also appear normal.',
      recommendations: [
        'Continue regular health monitoring',
        'Maintain healthy lifestyle habits',
        'Follow up as recommended by your doctor'
      ],
      confidence: 92
    }
  ]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an image file (JPEG, PNG, etc.)",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          
          // Add mock analysis
          const newAnalysis: XrayAnalysis = {
            id: Date.now().toString(),
            filename: file.name,
            uploadDate: new Date().toISOString().split('T')[0],
            status: 'analyzing',
            findings: [],
            explanation: '',
            recommendations: [],
            confidence: 0
          };

          setAnalyses(prev => [newAnalysis, ...prev]);
          
          toast({
            title: "Upload Complete",
            description: "Your X-ray is being analyzed. This may take a few minutes."
          });

          // Simulate analysis completion
          setTimeout(() => {
            setAnalyses(prev => prev.map(analysis => 
              analysis.id === newAnalysis.id 
                ? {
                    ...analysis,
                    status: 'completed' as const,
                    findings: ['Analysis completed successfully'],
                    explanation: 'AI analysis has been completed for your X-ray image. Please note that this is for informational purposes only and should not replace professional medical diagnosis.',
                    recommendations: ['Consult with your doctor to discuss these results'],
                    confidence: 87
                  }
                : analysis
            ));
          }, 3000);

          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleDownloadReport = (analysis: XrayAnalysis) => {
    toast({
      title: "Downloading Report",
      description: `Preparing detailed report for ${analysis.filename}`
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground font-display">X-ray AI Explainer</h2>
        <Badge variant="secondary">Beta Feature</Badge>
      </div>

      {/* Disclaimer */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Medical Disclaimer:</strong> This AI analysis is for educational purposes only and should not be used as a substitute for professional medical diagnosis or treatment. Always consult with qualified healthcare providers.
        </AlertDescription>
      </Alert>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="w-5 h-5 mr-2" />
            Upload X-ray Image
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
            <FileImage className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Upload your X-ray image</h3>
            <p className="text-muted-foreground mb-4">
              Supported formats: JPEG, PNG, DICOM (max 10MB)
            </p>
            <input
              type="file"
              id="xray-upload"
              className="hidden"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
            <label htmlFor="xray-upload">
              <Button variant="outline" disabled={isUploading} asChild>
                <span>
                  {isUploading ? 'Uploading...' : 'Choose File'}
                </span>
              </Button>
            </label>
          </div>

          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Results */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Analysis History</h3>
        
        {analyses.map((analysis) => (
          <Card key={analysis.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center">
                    <Brain className="w-5 h-5 mr-2 text-blue-600" />
                    {analysis.filename}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Uploaded: {new Date(analysis.uploadDate).toLocaleDateString()}
                  </p>
                </div>
                <Badge 
                  variant={
                    analysis.status === 'completed' ? 'secondary' : 
                    analysis.status === 'analyzing' ? 'outline' : 
                    'destructive'
                  }
                >
                  {analysis.status === 'completed' && 'Analysis Complete'}
                  {analysis.status === 'analyzing' && 'Analyzing...'}
                  {analysis.status === 'error' && 'Analysis Error'}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {analysis.status === 'analyzing' && (
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span className="text-muted-foreground">AI is analyzing your X-ray...</span>
                </div>
              )}

              {analysis.status === 'completed' && (
                <>
                  {/* Confidence Score */}
                  {analysis.confidence > 0 && (
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>AI Confidence</span>
                        <span>{analysis.confidence}%</span>
                      </div>
                      <Progress value={analysis.confidence} />
                    </div>
                  )}

                  {/* Key Findings */}
                  {analysis.findings.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Key Findings:</h4>
                      <ul className="space-y-1">
                        {analysis.findings.map((finding, index) => (
                          <li key={index} className="flex items-start text-sm">
                            <span className="w-1 h-1 bg-primary rounded-full mr-2 mt-2"></span>
                            {finding}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* AI Explanation */}
                  {analysis.explanation && (
                    <div>
                      <h4 className="font-medium mb-2">AI Explanation:</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed bg-muted p-3 rounded-lg">
                        {analysis.explanation}
                      </p>
                    </div>
                  )}

                  {/* Recommendations */}
                  {analysis.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Recommendations:</h4>
                      <ul className="space-y-1">
                        {analysis.recommendations.map((recommendation, index) => (
                          <li key={index} className="flex items-start text-sm">
                            <span className="w-1 h-1 bg-green-600 rounded-full mr-2 mt-2"></span>
                            {recommendation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDownloadReport(analysis)}
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Download Report
                    </Button>
                    <Button variant="outline" size="sm">
                      <Eye className="w-3 h-3 mr-1" />
                      View Image
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}

        {analyses.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <FileImage className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No X-rays uploaded yet</h3>
              <p className="text-muted-foreground">
                Upload your first X-ray image to get AI-powered explanations.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};