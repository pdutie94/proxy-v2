"use client";

import { useState, useCallback } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  Form, 
  FormLayout, 
  TextField, 
  Button, 
  Text, 
  BlockStack, 
  Box,
  Banner,
  Divider
} from "@shopify/polaris";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }, [email, password, router]);

  return (
    <Box maxWidth="400px" width="100%">
      {/* Container for border glow effect */}
      <div style={{
        padding: '1px',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 100%)',
        borderRadius: '12px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
      }}>
        <Card roundedAbove="md">
          <BlockStack gap="600">
            <BlockStack gap="200" align="center">
              <div style={{ textAlign: 'center' }}>
                <img 
                  src="/logo.png" 
                  alt="ProxyV2 Logo" 
                  style={{ 
                    height: '52px', 
                    marginBottom: '16px',
                    filter: 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.2))'
                  }} 
                />
              </div>
              <Text as="h1" variant="headingXl" alignment="center">Welcome back</Text>
              <Text as="p" variant="bodyMd" tone="subdued" alignment="center">
                Log in to manage your high-scale infrastructure.
              </Text>
            </BlockStack>

            {error && (
              <Banner tone="critical">
                <p>{error}</p>
              </Banner>
            )}

            <Form onSubmit={handleSubmit}>
              <FormLayout>
                <TextField
                  label="Email"
                  value={email}
                  onChange={setEmail}
                  type="email"
                  autoComplete="email"
                  placeholder="admin@proxy.com"
                  focused
                />
                <TextField
                  label="Password"
                  value={password}
                  onChange={setPassword}
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
                <Box paddingBlockStart="200">
                  <Button 
                    variant="primary" 
                    submit 
                    loading={isLoading} 
                    fullWidth
                    size="large"
                  >
                    Sign in to Dashboard
                  </Button>
                </Box>
              </FormLayout>
            </Form>

            <Divider />

            <BlockStack gap="200" align="center">
              <Text as="p" variant="bodySm" tone="subdued" alignment="center">
                Professional Proxy Management System
              </Text>
            </BlockStack>
          </BlockStack>
        </Card>
      </div>
    </Box>
  );
}
