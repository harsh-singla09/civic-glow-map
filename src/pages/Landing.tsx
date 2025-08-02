import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Camera, CheckCircle, Users, TrendingUp, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-cityscape.jpg";

const Landing = () => {
  const steps = [
    {
      icon: MapPin,
      title: "Report",
      description: "Spot an issue? Pin it on the map with photos and details.",
      color: "text-civic-blue"
    },
    {
      icon: Clock,
      title: "Track",
      description: "Follow real-time updates as authorities work on your report.",
      color: "text-civic-orange"
    },
    {
      icon: CheckCircle,
      title: "Resolve",
      description: "See your neighborhood improve with transparent resolution.",
      color: "text-civic-green"
    }
  ];

  const stats = [
    { number: "5,000+", label: "Issues Resolved", icon: CheckCircle },
    { number: "15,000+", label: "Active Citizens", icon: Users },
    { number: "85%", label: "Resolution Rate", icon: TrendingUp }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-card/50 backdrop-blur-md border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <MapPin className="h-8 w-8 text-primary mr-2" />
              <span className="text-2xl font-bold text-foreground">CivicFlow</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                Dashboard
              </Link>
              <Link to="/report" className="text-muted-foreground hover:text-foreground transition-colors">
                Report Issue
              </Link>
              <Button variant="hero" size="sm">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="Modern cityscape at night" 
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-hero"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center animate-fade-in">
            <h1 className="text-4xl sm:text-6xl font-bold text-foreground mb-6">
              Smarter cities begin with
              <span className="block text-transparent bg-gradient-primary bg-clip-text">
                heard citizens
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Report civic issues, track their progress, and watch your community transform. 
              CivicFlow bridges the gap between citizens and city authorities with real-time transparency.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="lg" className="text-lg px-8 py-4">
                <MapPin className="mr-2 h-5 w-5" />
                Start Reporting
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                View Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to make your voice heard and drive positive change in your community.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <Card key={index} className="bg-card border-border hover:border-primary/50 transition-all duration-300 group">
                <CardContent className="p-8 text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <step.icon className={`h-8 w-8 ${step.color}`} />
                  </div>
                  <h3 className="text-2xl font-semibold text-foreground mb-4">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <Card key={index} className="bg-gradient-to-br from-card to-muted border-border text-center group hover:scale-105 transition-transform duration-300">
                <CardContent className="p-8">
                  <stat.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                  <div className="text-4xl font-bold text-foreground mb-2">{stat.number}</div>
                  <div className="text-muted-foreground font-medium">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-hero">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
            Ready to Transform Your Community?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of engaged citizens making a real difference in their neighborhoods.
          </p>
          <Button variant="hero" size="lg" className="text-lg px-12 py-4">
            <Camera className="mr-2 h-5 w-5" />
            Report Your First Issue
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <MapPin className="h-6 w-6 text-primary mr-2" />
                <span className="text-xl font-bold text-foreground">CivicFlow</span>
              </div>
              <p className="text-muted-foreground">
                Empowering citizens to build better communities through transparent civic engagement.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4">Platform</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link></li>
                <li><Link to="/report" className="hover:text-foreground transition-colors">Report Issue</Link></li>
                <li><Link to="/admin" className="hover:text-foreground transition-colors">Admin Portal</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4">Support</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4">Connect</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">LinkedIn</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">GitHub</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 CivicFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;