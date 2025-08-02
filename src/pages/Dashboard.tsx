import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Plus, Filter, ThumbsUp, Clock, CheckCircle, AlertTriangle, Camera, Search } from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDistance, setSelectedDistance] = useState("5km");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "roads", label: "Roads & Transport" },
    { value: "lighting", label: "Street Lighting" },
    { value: "waste", label: "Waste Management" },
    { value: "parks", label: "Parks & Recreation" },
    { value: "safety", label: "Public Safety" }
  ];

  const issues = [
    {
      id: 1,
      title: "Pothole on Main Street",
      description: "Large pothole causing traffic issues near the intersection",
      category: "roads",
      status: "in_progress",
      upvotes: 23,
      location: "Main St & 5th Ave",
      timeAgo: "2 hours ago",
      priority: "high",
      photos: 3
    },
    {
      id: 2,
      title: "Broken Street Light",
      description: "Street light has been out for a week, making the area unsafe at night",
      category: "lighting",
      status: "reported",
      upvotes: 15,
      location: "Park Avenue",
      timeAgo: "1 day ago",
      priority: "medium",
      photos: 2
    },
    {
      id: 3,
      title: "Overflowing Garbage Bin",
      description: "Public bin overflowing, attracting pests and creating smell",
      category: "waste",
      status: "resolved",
      upvotes: 8,
      location: "Downtown Plaza",
      timeAgo: "3 days ago",
      priority: "low",
      photos: 1
    },
    {
      id: 4,
      title: "Damaged Playground Equipment",
      description: "Swing set chains are broken, potentially dangerous for children",
      category: "parks",
      status: "assigned",
      upvotes: 34,
      location: "Central Park",
      timeAgo: "5 hours ago",
      priority: "high",
      photos: 4
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "reported": return "bg-civic-orange/20 text-civic-orange border-civic-orange/30";
      case "assigned": return "bg-civic-blue/20 text-civic-blue border-civic-blue/30";
      case "in_progress": return "bg-civic-purple/20 text-civic-purple border-civic-purple/30";
      case "resolved": return "bg-civic-green/20 text-civic-green border-civic-green/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "reported": return <AlertTriangle className="h-3 w-3" />;
      case "assigned": return <Clock className="h-3 w-3" />;
      case "in_progress": return <Clock className="h-3 w-3" />;
      case "resolved": return <CheckCircle className="h-3 w-3" />;
      default: return null;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-destructive";
      case "medium": return "text-civic-orange";
      case "low": return "text-civic-green";
      default: return "text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <MapPin className="h-8 w-8 text-primary mr-2" />
                <span className="text-2xl font-bold text-foreground">CivicFlow</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/admin">
                <Button variant="ghost" size="sm">
                  Admin Portal
                </Button>
              </Link>
              <Link to="/report">
                <Button variant="hero" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Report Issue
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-primary" />
                  Issue Map
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[520px] p-0">
                <div className="w-full h-full bg-gradient-to-br from-muted/50 to-card rounded-b-lg flex items-center justify-center relative overflow-hidden">
                  {/* Map Placeholder */}
                  <div className="absolute inset-0 bg-gradient-to-br from-background/20 to-card/40"></div>
                  <div className="text-center z-10">
                    <MapPin className="h-16 w-16 text-primary mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground text-lg">Interactive Map Coming Soon</p>
                    <p className="text-muted-foreground text-sm mt-2">
                      View and report issues directly on the map
                    </p>
                  </div>
                  
                  {/* Mock Issue Pins */}
                  <div className="absolute top-20 left-16 w-6 h-6 bg-destructive rounded-full border-2 border-background animate-pulse shadow-lg"></div>
                  <div className="absolute top-32 right-24 w-6 h-6 bg-civic-orange rounded-full border-2 border-background animate-pulse shadow-lg"></div>
                  <div className="absolute bottom-24 left-32 w-6 h-6 bg-civic-green rounded-full border-2 border-background animate-pulse shadow-lg"></div>
                  <div className="absolute bottom-16 right-16 w-6 h-6 bg-civic-blue rounded-full border-2 border-background animate-pulse shadow-lg"></div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters & Issues */}
          <div className="space-y-6">
            {/* Filters */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Filter className="h-5 w-5 mr-2 text-primary" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search issues..."
                    className="pl-10 bg-background border-border"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Category</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Distance</label>
                  <Select value={selectedDistance} onValueChange={setSelectedDistance}>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1km">Within 1km</SelectItem>
                      <SelectItem value="3km">Within 3km</SelectItem>
                      <SelectItem value="5km">Within 5km</SelectItem>
                      <SelectItem value="10km">Within 10km</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Status</label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="reported">Reported</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-gradient-to-br from-civic-blue/10 to-civic-blue/5 border-civic-blue/20">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-civic-blue">142</div>
                  <div className="text-sm text-muted-foreground">Open Issues</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-civic-green/10 to-civic-green/5 border-civic-green/20">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-civic-green">89</div>
                  <div className="text-sm text-muted-foreground">Resolved Today</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Issues List */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-foreground">Recent Issues</h2>
            <Link to="/report">
              <Button variant="hero" className="shadow-lg">
                <Plus className="h-4 w-4 mr-2" />
                Report New Issue
              </Button>
            </Link>
          </div>

          <div className="grid gap-4">
            {issues.map((issue) => (
              <Card key={issue.id} className="bg-card border-border hover:border-primary/50 transition-all duration-300 group cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                          {issue.title}
                        </h3>
                        <Badge variant="outline" className={`${getPriorityColor(issue.priority)} border-current`}>
                          {issue.priority}
                        </Badge>
                      </div>
                      
                      <p className="text-muted-foreground mb-3">{issue.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {issue.location}
                        </div>
                        <div className="flex items-center">
                          <Camera className="h-4 w-4 mr-1" />
                          {issue.photos} photos
                        </div>
                        <span>{issue.timeAgo}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <Badge className={getStatusColor(issue.status)}>
                          {getStatusIcon(issue.status)}
                          <span className="ml-1 capitalize">{issue.status.replace('_', ' ')}</span>
                        </Badge>
                        
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          {issue.upvotes}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <Link to="/report">
        <Button 
          variant="hero" 
          size="lg"
          className="fixed bottom-6 right-6 rounded-full h-14 w-14 shadow-2xl hover:scale-110 transition-all duration-300 z-50"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </Link>
    </div>
  );
};

export default Dashboard;