import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Box, Loader2, ArrowLeft, Package, BarChart3, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function Auth() {
  const { user, loading: authLoading, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Sign In form state - load remembered email
  const [signInEmail, setSignInEmail] = useState(() => {
    const remembered = localStorage.getItem('remembered_email');
    return remembered || '';
  });
  const [signInPassword, setSignInPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => {
    return !!localStorage.getItem('remembered_email');
  });

  // Sign Up form state
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpDisplayName, setSignUpDisplayName] = useState('');

  // Forgot password state
  const [resetEmail, setResetEmail] = useState('');

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(signInEmail, signInPassword, rememberMe);
    setLoading(false);

    if (!error) {
      // Save or clear remembered email based on checkbox
      if (rememberMe) {
        localStorage.setItem('remembered_email', signInEmail);
      } else {
        localStorage.removeItem('remembered_email');
      }
    } else {
      toast({
        title: 'Sign in failed',
        description: 'Invalid email or password. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signUp(signUpEmail, signUpPassword, signUpDisplayName);
    setLoading(false);

    if (error) {
      toast({
        title: 'Sign up failed',
        description: 'Unable to create account. Please check your details and try again.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Check your email',
        description: 'We sent you a confirmation link to verify your account.',
      });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast({
        title: 'Email required',
        description: 'Please enter your email address.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/auth`,
    });
    setLoading(false);

    if (error) {
      console.error('Password reset error:', error);
      toast({
        title: 'Reset failed',
        description: 'Unable to send reset email. Please try again.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Check your email',
        description: 'We sent you a password reset link.',
      });
      setShowForgotPassword(false);
      setResetEmail('');
    }
  };

  // Branding/Feature section component
  const BrandingSection = () => (
    <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/90 to-primary flex-col justify-between p-12 text-primary-foreground relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 border-2 border-current rounded-full" />
        <div className="absolute top-40 right-20 w-48 h-48 border-2 border-current rounded-full" />
        <div className="absolute bottom-20 left-20 w-24 h-24 border-2 border-current rounded-full" />
        <div className="absolute bottom-40 right-10 w-40 h-40 border-2 border-current rounded-full" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-foreground/20 backdrop-blur-sm">
            <Box className="h-6 w-6" />
          </div>
          <span className="text-2xl font-bold">Inventory Manager</span>
        </div>
        <p className="text-primary-foreground/80 text-lg">
          Streamline your business operations
        </p>
      </div>

      <div className="relative z-10 space-y-8">
        <h2 className="text-3xl font-bold leading-tight">
          Take control of your inventory with powerful tools
        </h2>
        
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/20 backdrop-blur-sm">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Smart Inventory Tracking</h3>
              <p className="text-primary-foreground/80">
                Track stock levels, manage multiple warehouses, and never run out of critical items.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/20 backdrop-blur-sm">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Real-time Analytics</h3>
              <p className="text-primary-foreground/80">
                Get insights into sales trends, purchase patterns, and inventory performance.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/20 backdrop-blur-sm">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Secure & Reliable</h3>
              <p className="text-primary-foreground/80">
                Your data is protected with enterprise-grade security and automatic backups.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10">
        <p className="text-primary-foreground/60 text-sm">
          Trusted by businesses worldwide to manage their inventory efficiently.
        </p>
      </div>
    </div>
  );

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex">
        <BrandingSection />
        <div className="w-full lg:w-1/2 flex items-center justify-center bg-background px-4 py-12">
          <Card className="w-full max-w-md border-0 shadow-none lg:shadow-lg lg:border">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4 lg:hidden">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
                  <Box className="h-6 w-6 text-primary-foreground" />
                </div>
              </div>
              <CardTitle className="text-2xl">Reset Password</CardTitle>
              <CardDescription>Enter your email to receive a reset link</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="you@example.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Reset Link
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setShowForgotPassword(false)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Sign In
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <BrandingSection />
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-background px-4 py-12">
        <Card className="w-full max-w-md border-0 shadow-none lg:shadow-lg lg:border">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4 lg:hidden">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
                <Box className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>Sign in to manage your inventory</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder=""
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="remember-me" 
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked === true)}
                      />
                      <Label 
                        htmlFor="remember-me" 
                        className="text-sm font-normal cursor-pointer text-muted-foreground"
                      >
                        Remember me
                      </Label>
                    </div>
                    <Button
                      type="button"
                      variant="link"
                      className="px-0 text-sm text-muted-foreground hover:text-primary"
                      onClick={() => setShowForgotPassword(true)}
                    >
                      Forgot password?
                    </Button>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Display Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      value={signUpDisplayName}
                      onChange={(e) => setSignUpDisplayName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder=""
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
