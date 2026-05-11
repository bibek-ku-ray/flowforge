"use client";

import {
  EntityContainer,
  EntityHeader,
  EntityList,
  EntityItem,
  EntityPagination,
  EntitySearch,
  EmptyView,
  LoadingView,
  ErrorView,
} from "@/components/entity-components";
import { useWorkflowParams } from "@/features/workflows/hooks/use-workflow-params";
import {
  useCreateWorkflow,
  useRemoveWorkflow,
  useSuspenseWorkflows,
} from "@/features/workflows/hooks/use-workflows";
import { WorkflowIcon } from "lucide-react";

export const WorkflowContainer = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [params, setParams] = useWorkflowParams();
  const createWorkflow = useCreateWorkflow();

  return (
    <EntityContainer
      header={
        <EntityHeader
          title="Workflows"
          description="Manage your automation workflows"
          onNew={() => createWorkflow.mutate()}
          newButtonLabel="New workflow"
          isCreating={createWorkflow.isPending}
        />
      }
      search={
        <EntitySearch
          value={params.search}
          onChange={(search) => setParams({ search, page: 1 })}
          placeholder="Search workflows..."
        />
      }
    >
      {children}
    </EntityContainer>
  );
};

export const WorkflowList = () => {
  const { data } = useSuspenseWorkflows();
  const [params, setParams] = useWorkflowParams();
  const removeWorkflow = useRemoveWorkflow();

  return (
    <>
      <EntityList
        items={data.items}
        getKey={(item) => item.id}
        emptyView={
          <EmptyView message="Get started by creating a new workflow." />
        }
        renderItem={(item) => (
          <EntityItem
            href={`/workflows/${item.id}`}
            title={item.name}
            subtitle={new Date(item.updatedAt).toLocaleDateString()}
            image={
              <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <WorkflowIcon className="size-5 text-primary" />
              </div>
            }
            onRemove={() => removeWorkflow.mutate({ id: item.id })}
            isRemoving={removeWorkflow.isPending}
          />
        )}
      />
      {data.totalPages > 0 && (
        <EntityPagination
          page={data.page}
          totalPages={data.totalPages}
          onPageChange={(page) => setParams({ page })}
          disabled={removeWorkflow.isPending}
        />
      )}
    </>
  );
};

export const WorkflowLoading = () => {
  return <LoadingView message="Loading workflows..." />;
};

export const WorkflowError = () => {
  return <ErrorView message="Failed to load workflows." />;
};
