import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters long' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  subject: z.string().min(5, { message: 'Subject must be at least 5 characters long' }),
  message: z.string().min(10, { message: 'Message must be at least 10 characters long' }),
  reason: z.string({ required_error: 'Please select a reason for contact' })
});

type FormValues = z.infer<typeof formSchema>;

const Contact = () => {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
      reason: ''
    }
  });

  const onSubmit = async (data: FormValues) => {
    try {
      // In a real app, we would send this data to a backend API
      console.log('Form data:', data);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsSubmitted(true);
      toast({
        title: 'Message sent!',
        description: 'We will get back to you shortly.',
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'There was a problem sending your message. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-center mb-8">Contact Us</h1>
      <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
        Have a question, suggestion, or want to report potentially misleading content? Get in touch with our team and we'll get back to you as soon as possible.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
        <div>
          {isSubmitted ? (
            <Card className="h-full flex flex-col justify-center items-center text-center">
              <CardContent className="pt-12 pb-12">
                <div className="mb-6 text-primary">
                  <CheckCircle className="h-24 w-24 mx-auto" />
                </div>
                <CardTitle className="text-2xl mb-4">Thank You!</CardTitle>
                <CardDescription className="text-lg">
                  Your message has been received. We'll respond to your inquiry as soon as possible.
                </CardDescription>
                <Button 
                  className="mt-8" 
                  onClick={() => setIsSubmitted(false)}
                >
                  Send Another Message
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Send Us a Message</CardTitle>
                <CardDescription>
                  Fill out the form below to get in touch with our team
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="your.email@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reason for Contact</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a reason" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="general_inquiry">General Inquiry</SelectItem>
                              <SelectItem value="report_content">Report Misleading Content</SelectItem>
                              <SelectItem value="feedback">Feedback</SelectItem>
                              <SelectItem value="api_access">API Access</SelectItem>
                              <SelectItem value="partnership">Partnership Opportunities</SelectItem>
                              <SelectItem value="technical_support">Technical Support</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject</FormLabel>
                          <FormControl>
                            <Input placeholder="Subject" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Your message..." 
                              className="min-h-[120px]" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full mt-4" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Sending...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <Send className="mr-2 h-4 w-4" /> Send Message
                        </span>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex flex-col space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                Here's how you can reach us
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start">
                <Mail className="h-5 w-5 mr-3 text-primary mt-1" />
                <div>
                  <h3 className="font-medium">Email</h3>
                  <p className="text-gray-600 dark:text-gray-400">contact@truthlens.com</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                    We'll respond within 24-48 hours
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Phone className="h-5 w-5 mr-3 text-primary mt-1" />
                <div>
                  <h3 className="font-medium">Phone</h3>
                  <p className="text-gray-600 dark:text-gray-400">+1 (555) 123-4567</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                    Monday to Friday, 9am to 5pm EST
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <MapPin className="h-5 w-5 mr-3 text-primary mt-1" />
                <div>
                  <h3 className="font-medium">Location</h3>
                  <p className="text-gray-600 dark:text-gray-400">123 Truth Street, Suite 456</p>
                  <p className="text-gray-600 dark:text-gray-400">New York, NY 10001</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Clock className="h-5 w-5 mr-3 text-primary mt-1" />
                <div>
                  <h3 className="font-medium">Office Hours</h3>
                  <p className="text-gray-600 dark:text-gray-400">Monday - Friday: 9am - 5pm EST</p>
                  <p className="text-gray-600 dark:text-gray-400">Saturday & Sunday: Closed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>FAQs</CardTitle>
              <CardDescription>
                Common questions about our services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium">How accurate is TruthLens?</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  TruthLens uses advanced AI algorithms with an accuracy rate of approximately 85-95% depending on the content type and available reference data.
                </p>
              </div>
              <div>
                <h3 className="font-medium">Can I use TruthLens API for my own project?</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Yes, we offer API access for developers. Please contact us for pricing and documentation.
                </p>
              </div>
              <div>
                <h3 className="font-medium">How do I report false positives/negatives?</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  You can report any issues with our analysis through the feedback form in the analysis results or by contacting us directly.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => window.location.href = "/about"}>
                View All FAQs
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Contact;