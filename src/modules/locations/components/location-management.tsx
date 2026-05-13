'use client';

import { useState } from 'react';
import Image from 'next/image';
import { 
  Page, 
  Layout, 
  Card, 
  IndexTable, 
  Button, 
  TextField, 
  InlineStack, 
  Text,
  Modal,
  FormLayout,
  EmptyState,
  Badge
} from '@shopify/polaris';
import { PlusIcon, DeleteIcon } from '@shopify/polaris-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { locationSchema, LocationInput } from '../schemas/location.schema';
import { createLocationAction, deleteLocationAction } from '../actions/location.action';
import { toast } from 'sonner';

interface Location {
  id: string;
  name: string;
  countryCode: string;
  _count?: {
    servers: number;
  };
}

interface LocationManagementProps {
  initialLocations: Location[];
}

export function LocationManagement({ initialLocations }: LocationManagementProps) {
  const [locations, setLocations] = useState(initialLocations);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<LocationInput>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: '',
      countryCode: '',
    }
  });

  const onSubmit = async (data: LocationInput) => {
    const result = await createLocationAction(data);
    if (result.success && result.data) {
      toast.success('Thêm vị trí mới thành công');
      setLocations([result.data, ...locations]);
      setIsModalOpen(false);
      reset();
    } else {
      toast.error(result.message || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa vị trí này?')) return;
    
    setIsDeleting(id);
    const result = await deleteLocationAction(id);
    if (result.success) {
      toast.success('Đã xóa vị trí');
      setLocations(locations.filter(l => l.id !== id));
    } else {
      toast.error(result.message || 'Có lỗi xảy ra');
    }
    setIsDeleting(null);
  };

  const resourceName = {
    singular: 'vị trí',
    plural: 'vị trí',
  };

  const rowMarkup = locations.map(
    ({ id, name, countryCode, _count }, index) => (
      <IndexTable.Row id={id} key={id} position={index}>
        <IndexTable.Cell>
          <InlineStack gap="200" align="start" blockAlign='center'>
            <Image 
              src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${countryCode.toUpperCase()}.svg`} 
              width={18} 
              height={12}
              alt={countryCode}
              style={{ 
                borderRadius: '1px', 
                border: '1px solid #E2E8F0',
                display: 'block' 
              }}
            />
            <Text variant="bodyMd" fontWeight="bold" as="span">{name}</Text>
          </InlineStack>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Badge tone="info">{countryCode}</Badge>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant="bodyMd" as="span">{_count?.servers || 0} máy chủ</Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Button 
            icon={DeleteIcon} 
            tone="critical" 
            variant="tertiary"
            loading={isDeleting === id}
            onClick={() => handleDelete(id)}
          />
        </IndexTable.Cell>
      </IndexTable.Row>
    ),
  );

  return (
    <Page 
      title="Quản lý Vị trí" 
      subtitle="Quản lý danh sách quốc gia và khu vực đặt máy chủ"
      primaryAction={{
        content: 'Thêm vị trí',
        icon: PlusIcon,
        onAction: () => setIsModalOpen(true),
      }}
    >
      <Layout>
        <Layout.Section>
          <Card padding="0">
            {locations.length > 0 ? (
              <IndexTable
                resourceName={resourceName}
                itemCount={locations.length}
                headings={[
                  { title: 'Tên vị trí' },
                  { title: 'Mã QG' },
                  { title: 'Sử dụng' },
                  { title: 'Thao tác' },
                ]}
                selectable={false}
              >
                {rowMarkup}
              </IndexTable>
            ) : (
              <EmptyState
                heading="Chưa có vị trí nào"
                action={{ content: 'Thêm vị trí đầu tiên', onAction: () => setIsModalOpen(true) }}
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              >
                <p>Hãy thêm vị trí để gán cho các máy chủ của bạn.</p>
              </EmptyState>
            )}
          </Card>
        </Layout.Section>
      </Layout>

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Thêm vị trí mới"
        primaryAction={{
          content: 'Lưu vị trí',
          onAction: handleSubmit(onSubmit),
          loading: isSubmitting,
        }}
        secondaryActions={[{
          content: 'Hủy',
          onAction: () => setIsModalOpen(false),
        }]}
      >
        <Modal.Section>
          <FormLayout>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Tên vị trí"
                  placeholder="Ví dụ: Việt Nam, Hoa Kỳ..."
                  error={errors.name?.message}
                  autoComplete="off"
                />
              )}
            />
            <Controller
              name="countryCode"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Mã quốc gia (ISO 3166-1 alpha-2)"
                  placeholder="VN, US, UK, SG..."
                  error={errors.countryCode?.message}
                  autoComplete="off"
                  helpText="Sử dụng 2 ký tự mã quốc gia để hiển thị icon cờ tự động."
                />
              )}
            />
          </FormLayout>
        </Modal.Section>
      </Modal>
    </Page>
  );
}


