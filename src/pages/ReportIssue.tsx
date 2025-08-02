import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, Camera, Upload, Loader2, ArrowLeft, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const ReportIssue = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<File[]>([]);
  const [useGPS, setUseGPS] = useState(true);
  const { toast } = useToast();

  const categories = [
    { value: "roads", label: "Roads & Transport", icon: "🚗" },
    { value: "lighting", label: "Street Lighting", icon: "💡" },
    { value: "waste", label: "Waste Management", icon: "🗑️" },
    { value: "parks", label: "Parks & Recreation", icon: "🌳" },
    { value: "safety", label: "Public Safety", icon: "🚨" },
    { value: "utilities", label: "Utilities", icon: "⚡" },
    { value: "other", label: "Other", icon: "📋" }
  ];

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (uploadedPhotos.length + files.length > 5) {
      toast({
        title: "Too many photos",
        description: "Maximum 5 photos allowed",
        variant: "destructive"
      });
      return;
    }
    setUploadedPhotos([...uploadedPhotos, ...files]);
  };

  const removePhoto = (index: number) => {
    setUploadedPhotos(uploadedPhotos.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    toast({
      title: "Issue reported successfully!",
      description: "Your report has been submitted and will be reviewed shortly.",
    });

    setIsSubmitting(false);
    // Redirect to dashboard or issue detail page
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/dashboard" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </Link>
            </div>
            <div className="flex items-center">
              <MapPin className="h-6 w-6 text-primary mr-2" />
              <span className="text-xl font-bold text-foreground">Report Issue</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Camera className="h-5 w-5 mr-2 text-primary" />
                  Report a Civic Issue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Title */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Issue Title *
                    </label>
                    <Input
                      placeholder="Brief description of the issue"
                      required
                      className="bg-background border-border"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Category *
                    </label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory} required>
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            <span className="flex items-center">
                              <span className="mr-2">{category.icon}</span>
                              {category.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Description *
                    </label>
                    <Textarea
                      placeholder="Provide detailed information about the issue, including when you first noticed it and any relevant context..."
                      rows={4}
                      required
                      className="bg-background border-border resize-none"
                    />
                  </div>

                  {/* Photo Upload */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Photos (Max 5)
                    </label>
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                          id="photo-upload"
                        />
                        <label htmlFor="photo-upload" className="cursor-pointer">
                          <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Click to upload photos or drag and drop
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            PNG, JPG up to 10MB each
                          </p>
                        </label>
                      </div>

                      {/* Photo Preview */}
                      {uploadedPhotos.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {uploadedPhotos.map((photo, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={URL.createObjectURL(photo)}
                                alt={`Upload ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg border border-border"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removePhoto(index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Location
                    </label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="use-gps"
                          checked={useGPS}
                          onCheckedChange={(checked) => setUseGPS(checked === true)}
                        />
                        <label htmlFor="use-gps" className="text-sm text-foreground">
                          Use my current location (GPS)
                        </label>
                      </div>
                      
                      {!useGPS && (
                        <Input
                          placeholder="Enter address or location"
                          className="bg-background border-border"
                        />
                      )}
                    </div>
                  </div>

                  {/* Anonymous Option */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="anonymous"
                      checked={isAnonymous}
                      onCheckedChange={(checked) => setIsAnonymous(checked === true)}
                    />
                    <label htmlFor="anonymous" className="text-sm text-foreground">
                      Report anonymously
                    </label>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    variant="hero"
                    size="lg"
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting Report...
                      </>
                    ) : (
                      <>
                        <Camera className="h-4 w-4 mr-2" />
                        Submit Report
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Location Map Preview */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-primary" />
                  Location Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-square bg-gradient-to-br from-muted/50 to-card rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 text-primary mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-muted-foreground">
                      {useGPS ? "Current location will be used" : "Manual location entry"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="bg-gradient-to-br from-civic-blue/5 to-civic-purple/5 border-civic-blue/20">
              <CardHeader>
                <CardTitle className="text-civic-blue">Reporting Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-civic-blue rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p>Include clear photos from multiple angles</p>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-civic-green rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p>Provide specific location details</p>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-civic-orange rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p>Describe the impact on the community</p>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-civic-purple rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p>Check if similar issues already exist</p>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Recent Reports</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <p className="font-medium text-foreground">Pothole on 5th Ave</p>
                  <p className="text-muted-foreground">Assigned • 2 hours ago</p>
                </div>
                <div className="text-sm">
                  <p className="font-medium text-foreground">Broken streetlight</p>
                  <p className="text-muted-foreground">In Progress • 1 day ago</p>
                </div>
                <div className="text-sm">
                  <p className="font-medium text-foreground">Graffiti removal</p>
                  <p className="text-muted-foreground">Resolved • 3 days ago</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportIssue;