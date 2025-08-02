import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Shield, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Users, 
  BarChart3, 
  MapPin, 
  User, 
  Calendar,
  Filter,
  Search,
  MoreHorizontal,
  Eye,
  UserCheck,
  Flag
} from "lucide-react";
import { Link } from "react-router-dom";

const AdminDashboard = () => {
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedAssignee, setSelectedAssignee] = useState("all");

  const stats = [
    { title: "Total Issues", value: "1,247", change: "+12%", icon: AlertTriangle, color: "text-civic-blue" },
    { title: "Open Issues", value: "342", change: "-5%", icon: Clock, color: "text-civic-orange" },
    { title: "Resolved Today", value: "28", change: "+18%", icon: CheckCircle, color: "text-civic-green" },
    { title: "Average Resolution", value: "3.2 days", change: "-2%", icon: BarChart3, color: "text-civic-purple" }
  ];

  const issues = [
    {
      id: 1,
      title: "Pothole on Main Street",
      category: "roads",
      status: "in_progress",
      priority: "high",
      reportedBy: "Sarah Johnson",
      assignedTo: "John Maintenance",
      reportedAt: "2024-01-15T10:30:00Z",
      location: "Main St & 5th Ave",
      upvotes: 23
    },
    {
      id: 2,
      title: "Broken Street Light",
      category: "lighting",
      status: "assigned",
      priority: "medium",
      reportedBy: "Mike Chen",
      assignedTo: "Electric Crew A",
      reportedAt: "2024-01-16T08:45:00Z",
      location: "Park Avenue",
      upvotes: 15
    },
    {
      id: 3,
      title: "Graffiti on Building Wall",
      category: "vandalism",
      status: "reported",
      priority: "low",
      reportedBy: "Anonymous",
      assignedTo: null,
      reportedAt: "2024-01-17T14:20:00Z",
      location: "Downtown Plaza",
      upvotes: 3
    },
    {
      id: 4,
      title: "Damaged Playground Equipment",
      category: "parks",
      status: "flagged",
      priority: "high",
      reportedBy: "Parent Community",
      assignedTo: null,
      reportedAt: "2024-01-17T09:15:00Z",
      location: "Central Park",
      upvotes: 34
    }
  ];

  const flaggedReports = [
    {
      id: 1,
      title: "Inappropriate content in report photos",
      type: "inappropriate_content",
      reportId: 156,
      flaggedBy: "Community",
      flaggedAt: "2024-01-17T16:30:00Z"
    },
    {
      id: 2,
      title: "Spam report - duplicate submission",
      type: "spam",
      reportId: 178,
      flaggedBy: "Auto-detection",
      flaggedAt: "2024-01-17T12:45:00Z"
    }
  ];

  const teams = [
    { name: "Public Works", activeIssues: 45, avgResolutionTime: "2.8 days" },
    { name: "Electric Crew A", activeIssues: 23, avgResolutionTime: "1.5 days" },
    { name: "Parks & Recreation", activeIssues: 18, avgResolutionTime: "4.2 days" },
    { name: "Waste Management", activeIssues: 12, avgResolutionTime: "1.2 days" }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "reported": return "bg-civic-orange/20 text-civic-orange border-civic-orange/30";
      case "assigned": return "bg-civic-blue/20 text-civic-blue border-civic-blue/30";
      case "in_progress": return "bg-civic-purple/20 text-civic-purple border-civic-purple/30";
      case "resolved": return "bg-civic-green/20 text-civic-green border-civic-green/30";
      case "flagged": return "bg-destructive/20 text-destructive border-destructive/30";
      default: return "bg-muted text-muted-foreground";
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
                <Shield className="h-8 w-8 text-primary mr-2" />
                <span className="text-2xl font-bold text-foreground">CivicFlow Admin</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Citizen View
                </Button>
              </Link>
              <Button variant="outline" size="sm">
                <User className="h-4 w-4 mr-2" />
                Admin Profile
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className={`text-xs ${stat.change.startsWith('+') ? 'text-civic-green' : 'text-destructive'}`}>
                      {stat.change} from last month
                    </p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="issues" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-fit">
            <TabsTrigger value="issues">All Issues</TabsTrigger>
            <TabsTrigger value="flagged">Flagged Reports</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
          </TabsList>

          {/* Issues Tab */}
          <TabsContent value="issues" className="space-y-6">
            {/* Filters */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Filter className="h-5 w-5 mr-2 text-primary" />
                  Filters & Search
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search issues..."
                      className="pl-10 bg-background border-border"
                    />
                  </div>
                  
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="reported">Reported</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="flagged">Flagged</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="roads">Roads & Transport</SelectItem>
                      <SelectItem value="lighting">Street Lighting</SelectItem>
                      <SelectItem value="waste">Waste Management</SelectItem>
                      <SelectItem value="parks">Parks & Recreation</SelectItem>
                      <SelectItem value="safety">Public Safety</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Assignees</SelectItem>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      <SelectItem value="john">John Maintenance</SelectItem>
                      <SelectItem value="electric">Electric Crew A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Issues List */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Issue Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {issues.map((issue) => (
                    <div key={issue.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary/50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-foreground">#{issue.id.toString().padStart(3, '0')} {issue.title}</h3>
                          <Badge className={getStatusColor(issue.status)}>
                            {issue.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className={`${getPriorityColor(issue.priority)} border-current`}>
                            {issue.priority.toUpperCase()}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            {issue.reportedBy}
                          </div>
                          <div className="flex items-center">
                            <UserCheck className="h-4 w-4 mr-1" />
                            {issue.assignedTo || "Unassigned"}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {issue.location}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(issue.reportedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              Manage
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-card border-border">
                            <DialogHeader>
                              <DialogTitle>Manage Issue #{issue.id}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium text-foreground mb-2 block">Status</label>
                                <Select defaultValue={issue.status}>
                                  <SelectTrigger className="bg-background border-border">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="reported">Reported</SelectItem>
                                    <SelectItem value="assigned">Assigned</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="resolved">Resolved</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div>
                                <label className="text-sm font-medium text-foreground mb-2 block">Assign To</label>
                                <Select defaultValue={issue.assignedTo || ""}>
                                  <SelectTrigger className="bg-background border-border">
                                    <SelectValue placeholder="Select assignee" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="john">John Maintenance</SelectItem>
                                    <SelectItem value="electric">Electric Crew A</SelectItem>
                                    <SelectItem value="parks">Parks Team</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div>
                                <label className="text-sm font-medium text-foreground mb-2 block">Admin Notes</label>
                                <Textarea
                                  placeholder="Add internal notes..."
                                  className="bg-background border-border resize-none"
                                  rows={3}
                                />
                              </div>
                              
                              <div className="flex justify-end space-x-2">
                                <Button variant="outline" size="sm">Cancel</Button>
                                <Button variant="hero" size="sm">Update Issue</Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Flagged Reports Tab */}
          <TabsContent value="flagged" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Flag className="h-5 w-5 mr-2 text-destructive" />
                  Flagged Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {flaggedReports.map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-4 border border-destructive/20 bg-destructive/5 rounded-lg">
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">{report.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Report #{report.reportId} • Flagged by {report.flaggedBy}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(report.flaggedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">Review</Button>
                        <Button variant="destructive" size="sm">Remove</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Most Reported Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-foreground">Roads & Transport</span>
                      <span className="text-sm font-medium">45%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-civic-blue h-2 rounded-full" style={{width: '45%'}}></div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-foreground">Street Lighting</span>
                      <span className="text-sm font-medium">28%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-civic-green h-2 rounded-full" style={{width: '28%'}}></div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-foreground">Parks & Recreation</span>
                      <span className="text-sm font-medium">16%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-civic-orange h-2 rounded-full" style={{width: '16%'}}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Resolution Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-civic-green">85%</div>
                      <p className="text-sm text-muted-foreground">Issues Resolved</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-civic-blue">3.2</div>
                      <p className="text-sm text-muted-foreground">Avg Days to Resolve</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-civic-purple">4.8/5</div>
                      <p className="text-sm text-muted-foreground">Citizen Satisfaction</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Teams Tab */}
          <TabsContent value="teams" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {teams.map((team, index) => (
                <Card key={index} className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="h-5 w-5 mr-2 text-primary" />
                      {team.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Active Issues</span>
                        <span className="font-medium text-foreground">{team.activeIssues}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Avg Resolution Time</span>
                        <span className="font-medium text-foreground">{team.avgResolutionTime}</span>
                      </div>
                      <Button variant="outline" size="sm" className="w-full">
                        View Team Details
                      </Button>
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

export default AdminDashboard;