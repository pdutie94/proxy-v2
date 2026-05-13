"use client";

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginSchema } from '@/modules/auth/schemas/login.schema';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { 
  Form, 
  FormLayout, 
  TextField, 
  Button, 
  Text, 
  BlockStack, 
  Box,
  Banner,
  Card,
  InlineStack,
  Divider,
  Icon
} from "@shopify/polaris";
import { LockIcon, EmailIcon } from "@shopify/polaris-icons";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    }
  });

  const onSubmit = async (data: LoginSchema) => {
    setLoading(true);
    setError(null);
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError('Email hoặc mật khẩu không chính xác');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError('Đã xảy ra lỗi khi đăng nhập');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxWidth="400px" width="100%">
      <Card>
        <Box padding="600">
          <BlockStack gap="600">
            <BlockStack gap="200" align="center">
              <Text as="h1" variant="headingLg" alignment="center">
                Đăng nhập hệ thống
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued" alignment="center">
                Vui lòng nhập thông tin để quản lý Proxy
              </Text>
            </BlockStack>

            {error && (
              <Banner tone="critical">
                <p>{error}</p>
              </Banner>
            )}

            <Form onSubmit={handleSubmit(onSubmit)}>
              <FormLayout>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      label="Địa chỉ Email"
                      prefix={<Icon source={EmailIcon} />}
                      autoComplete="email"
                      placeholder="admin@example.com"
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.email?.message ? "Email không hợp lệ" : undefined}
                    />
                  )}
                />
                <Controller
                  name="password"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      label="Mật khẩu"
                      prefix={<Icon source={LockIcon} />}
                      type="password"
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.password?.message ? "Mật khẩu tối thiểu 6 ký tự" : undefined}
                    />
                  )}
                />
                <Box paddingBlockStart="200">
                  <Button 
                    variant="primary" 
                    submit 
                    fullWidth 
                    size="large"
                    loading={loading}
                  >
                    Đăng nhập ngay
                  </Button>
                </Box>
              </FormLayout>
            </Form>

            <Divider />
            
            <InlineStack align="center">
              <Text as="p" variant="bodyXs" tone="subdued">
                © {new Date().getFullYear()} Antigravity Proxy V2
              </Text>
            </InlineStack>
          </BlockStack>
        </Box>
      </Card>
    </Box>
  );
}


