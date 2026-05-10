"use client";

import { useUsers } from '@/hooks/use-users';
import { 
  IndexTable, 
  Card, 
  Badge, 
  Text, 
  Button, 
  Box,
  SkeletonBodyText,
  InlineStack
} from "@shopify/polaris";
import { DeleteIcon } from "@shopify/polaris-icons";
import { format } from "date-fns";

export function UserList() {
  const { users, isLoading, deleteMutation } = useUsers();

  const resourceName = {
    singular: 'user',
    plural: 'users',
  };

  if (isLoading) {
    return (
      <Card>
        <Box padding="400">
          <SkeletonBodyText lines={5} />
        </Box>
      </Card>
    );
  }

  const rowMarkup = users.map(
    ({ id, email, role, createdAt }, index) => (
      <IndexTable.Row id={id} key={id} position={index}>
        <IndexTable.Cell>
          <Text as="span" fontWeight="bold">
            {email}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Badge tone={role === 'ADMIN' ? 'info' : 'default'}>{role}</Badge>
        </IndexTable.Cell>
        <IndexTable.Cell>
          {format(new Date(createdAt), 'MMM dd, yyyy')}
        </IndexTable.Cell>
        <IndexTable.Cell>
          <InlineStack align="end">
            <Button 
              icon={DeleteIcon} 
              variant="tertiary" 
              tone="critical"
              onClick={() => {
                if (confirm('Are you sure you want to delete this user?')) {
                  deleteMutation.mutate(id);
                }
              }}
            />
          </InlineStack>
        </IndexTable.Cell>
      </IndexTable.Row>
    ),
  );

  return (
    <Card padding="0">
      <IndexTable
        resourceName={resourceName}
        itemCount={users.length}
        headings={[
          { title: 'User Email' },
          { title: 'Role' },
          { title: 'Created At' },
          { title: 'Actions', alignment: 'end' },
        ]}
        selectable={false}
      >
        {rowMarkup}
      </IndexTable>
    </Card>
  );
}
