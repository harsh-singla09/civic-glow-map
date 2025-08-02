import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Camera, ThumbsUp, ThumbsDown, Flag, ArrowLeft, Clock, CheckCircle, User, MessageCircle, Share2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const IssueDetail = () => {
  const [upvoted, setUpvoted] = useState(false);
  const [downvoted, setDownvoted] = useState(false);
  const [newComment, setNewComment] = useState("");
  const { toast } = useToast();

  const issue = {
    id: 1,
    title: "Pothole on Main Street causing traffic issues",
    description: "There's a large pothole on Main Street near the intersection with 5th Avenue. It's been there for over a week and is causing cars to swerve dangerously. The hole is about 3 feet wide and quite deep. Multiple vehicles have already suffered tire damage.",
    category: "roads",
    status: "in_progress",
    priority: "high",
    upvotes: 23,
    downvotes: 2,
    location: "Main St & 5th Ave",
    reportedBy: "Sarah Johnson",
    reportedAt: "2024-01-15T10:30:00Z",
    assignedTo: "Public Works Department",
    estimatedResolution: "2024-01-20",
    photos: [
      "/api/placeholder/400/300",
      "/api/placeholder/400/300",
      "/api/placeholder/400/300"
    ]
  };

  const timeline = [
    {
      id: 1,
      type: "reported",
      title: "Issue Reported",
      description: "Pothole reported by citizen",
      timestamp: "2024-01-15T10:30:00Z",
      user: "Sarah Johnson",
      icon: <MapPin className="h-4 w-4" />
    },
    {
      id: 2,
      type: "assigned",
      title: "Assigned to Department",
      description: "Issue assigned to Public Works Department",
      timestamp: "2024-01-16T09:15:00Z",
      user: "System",
      icon: <User className="h-4 w-4" />
    },
    {
      id: 3,
      type: "in_progress",
      title: "Work Started",
      description: "Repair crew dispatched to location",
      timestamp: "2024-01-17T14:20:00Z",
      user: "Public Works",
      icon: <Clock className="h-4 w-4" />
    }
  ];

  const comments = [
    {
      id: 1,
      user: "Mike Chen",
      avatar: "/api/placeholder/32/32",
      comment: "I drive this route daily and can confirm this is a serious hazard. Thanks for reporting!",
      timestamp: "2024-01-16T08:45:00Z",
      isVerified: true
    },
    {
      id: 2,
      user: "Public Works",
      avatar: "/api/placeholder/32/32",
      comment: "We've received the report and have scheduled this for repair. Expected completion by Friday.",
      timestamp: "2024-01-16T11:30:00Z",
      isOfficial: true
    }
  ];

  const handleVote = (type: 'up' | 'down') => {
    if (type === 'up') {
      setUpvoted(!upvoted);
      if (downvoted) setDownvoted(false);
    } else {
      setDownvoted(!downvoted);
      if (upvoted) setUpvoted(false);
    }
    
    toast({
      title: `${type === 'up' ? 'Upvoted' : 'Downvoted'} issue`,
      description: "Thank you for your feedback!"
    });
  };

  const handleComment = () => {
    if (!newComment.trim()) return;
    
    toast({
      title: "Comment added",
      description: "Your comment has been posted successfully."
    });
    setNewComment("");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "reported": return "bg-civic-orange/20 text-civic-orange border-civic-orange/30";
      case "assigned": return "bg-civic-blue/20 text-civic-blue border-civic-blue/30";
      case "in_progress": return "bg-civic-purple/20 text-civic-purple border-civic-purple/30";
      case "resolved": return "bg-civic-green/20 text-civic-green border-civic-green/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-destructive border-destructive/30 bg-destructive/10";
      case "medium": return "text-civic-orange border-civic-orange/30 bg-civic-orange/10";
      case "low": return "text-civic-green border-civic-green/30 bg-civic-green/10";
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
              <Link to="/dashboard" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Flag className="h-4 w-4 mr-2" />
                Report
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Issue Header */}
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-foreground mb-2">{issue.title}</h1>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={getStatusColor(issue.status)}>
                        <Clock className="h-3 w-3 mr-1" />
                        {issue.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className={getPriorityColor(issue.priority)}>
                        {issue.priority.toUpperCase()} PRIORITY
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={upvoted ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleVote('up')}
                      className={upvoted ? "bg-civic-green hover:bg-civic-green/90" : ""}
                    >
                      <ThumbsUp className="h-4 w-4 mr-1" />
                      {issue.upvotes + (upvoted ? 1 : 0)}
                    </Button>
                    <Button
                      variant={downvoted ? "destructive" : "outline"}
                      size="sm"
                      onClick={() => handleVote('down')}
                    >
                      <ThumbsDown className="h-4 w-4 mr-1" />
                      {issue.downvotes + (downvoted ? 1 : 0)}
                    </Button>
                  </div>
                </div>

                <p className="text-muted-foreground mb-4 leading-relaxed">{issue.description}</p>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {issue.location}
                  </div>
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    Reported by {issue.reportedBy}
                  </div>
                  <div>
                    {new Date(issue.reportedAt).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Photos */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Camera className="h-5 w-5 mr-2 text-primary" />
                  Photos ({issue.photos.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {issue.photos.map((photo, index) => (
                    <div key={index} className="relative group cursor-pointer">
                      <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                        <div className="w-full h-full bg-gradient-to-br from-muted to-card flex items-center justify-center">
                          <Camera className="h-8 w-8 text-muted-foreground opacity-50" />
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm">View larger</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Comments */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageCircle className="h-5 w-5 mr-2 text-primary" />
                  Comments ({comments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add Comment */}
                <div className="space-y-3">
                  <Textarea
                    placeholder="Add a comment... (verified users only)"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="bg-background border-border resize-none"
                    rows={3}
                  />
                  <Button 
                    onClick={handleComment}
                    disabled={!newComment.trim()}
                    variant="hero"
                    size="sm"
                  >
                    Post Comment
                  </Button>
                </div>

                {/* Comment List */}
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.avatar} />
                        <AvatarFallback>{comment.user[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-foreground text-sm">{comment.user}</span>
                          {comment.isOfficial && (
                            <Badge variant="outline" className="text-xs bg-civic-blue/10 text-civic-blue border-civic-blue/30">
                              Official
                            </Badge>
                          )}
                          {comment.isVerified && (
                            <Badge variant="outline" className="text-xs bg-civic-green/10 text-civic-green border-civic-green/30">
                              Verified
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{comment.comment}</p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Issue Info */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Issue Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Category</label>
                  <p className="text-foreground capitalize">{issue.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Assigned To</label>
                  <p className="text-foreground">{issue.assignedTo}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Estimated Resolution</label>
                  <p className="text-foreground">{new Date(issue.estimatedResolution).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Issue ID</label>
                  <p className="text-foreground font-mono text-sm">#{issue.id.toString().padStart(6, '0')}</p>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {timeline.map((event, index) => (
                    <div key={event.id} className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        index === timeline.length - 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                        {event.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{event.title}</p>
                        <p className="text-xs text-muted-foreground">{event.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(event.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Location Map */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-primary" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-square bg-gradient-to-br from-muted/50 to-card rounded-lg flex items-center justify-center relative overflow-hidden">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 text-primary mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-muted-foreground">{issue.location}</p>
                  </div>
                  {/* Mock pin */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-destructive rounded-full border-2 border-background animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueDetail;