"use client";

import { 
  Modal, 
  Text, 
  TextField, 
  Button, 
  BlockStack, 
  Box, 
  IndexTable, 
  Badge, 
  InlineStack,
  EmptyState,
  Spinner
} from "@shopify/polaris";
import { DeleteIcon } from "@shopify/polaris-icons";
import { useState, useCallback } from "react";
import { useSubnets } from "@/hooks/use-subnets";

interface SubnetManagementModalProps {
  serverId: string | null;
  serverName: string | null;
  open: boolean;
  onClose: () => void;
}

export function SubnetManagementModal({ serverId, serverName, open, onClose }: SubnetManagementModalProps) {
  const [newRange, setNewRange] = useState("");
  const { subnets, isLoading, addMutation, deleteMutation, updateStatusMutation } = useSubnets(serverId || "");

  const handleAdd = useCallback(() => {
    if (!newRange) return;
    addMutation.mutate(newRange, {
      onSuccess: () => setNewRange(""),
    });
  }, [newRange, addMutation]);

  const rowMarkup = subnets.map((subnet: any, index: number) => (
    <IndexTable.Row id={subnet.id} key={subnet.id} position={index}>
      <IndexTable.Cell>
        <Text as="span" fontWeight="bold">{subnet.ipv6Range}</Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Badge tone={subnet.status === 'ACTIVE' ? 'success' : 'critical'}>
          {subnet.status === 'ACTIVE' ? 'Đang chạy' : 'Bị chặn'}
        </Badge>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <InlineStack align="end" gap="200">
          <Button 
            variant="tertiary" 
            onClick={() => updateStatusMutation.mutate({ 
              subnetId: subnet.id, 
              status: subnet.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE' 
            })}
          >
            {subnet.status === 'ACTIVE' ? 'Tạm dừng' : 'Kích hoạt'}
          </Button>
          <Button 
            icon={DeleteIcon} 
            tone="critical" 
            variant="tertiary" 
            onClick={() => deleteMutation.mutate(subnet.id)}
            loading={deleteMutation.isPending && deleteMutation.variables === subnet.id}
          />
        </InlineStack>
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Quản lý IPv6 Subnets - ${serverName}`}
      large
    >
      <Modal.Section>
        <BlockStack gap="400">
          <Box background="bg-surface-secondary" padding="400" borderRadius="200">
            <BlockStack gap="300">
              <Text as="h3" variant="headingSm">Thêm Subnet mới</Text>
              <InlineStack gap="200">
                <div style={{ flexGrow: 1 }}>
                  <TextField
                    label="Dải IPv6 (CIDR)"
                    labelHidden
                    value={newRange}
                    onChange={setNewRange}
                    placeholder="Ví dụ: 2001:db8:a::/64"
                    autoComplete="off"
                  />
                </div>
                <Button 
                  variant="primary" 
                  onClick={handleAdd} 
                  loading={addMutation.isPending}
                >
                  Thêm dải
                </Button>
              </InlineStack>
              <Text as="p" variant="bodySm" tone="subdued">
                Lưu ý: Bạn nên nhập dải /64. Hệ thống sẽ xoay IP ngẫu nhiên trong dải này.
              </Text>
            </BlockStack>
          </Box>

          <BlockStack gap="200">
            <Text as="h3" variant="headingSm">Danh sách Subnets</Text>
            {isLoading ? (
              <Box padding="800" textAlign="center">
                <Spinner size="large" />
              </Box>
            ) : subnets.length === 0 ? (
              <EmptyState
                heading="Chưa có subnet nào"
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              >
                <p>Thêm dải IPv6 để hệ thống có thể xoay IP ngẫu nhiên.</p>
              </EmptyState>
            ) : (
              <IndexTable
                resourceName={{ singular: 'subnet', plural: 'subnets' }}
                itemCount={subnets.length}
                headings={[
                  { title: 'Dải IPv6' },
                  { title: 'Trạng thái' },
                  { title: 'Thao tác', alignment: 'end' },
                ]}
                selectable={false}
              >
                {rowMarkup}
              </IndexTable>
            )}
          </BlockStack>
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}
