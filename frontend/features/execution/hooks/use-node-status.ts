import type { Realtime } from "inngest";
import { useRealtime } from "inngest/react";
import { useEffect, useState } from "react";
import type { NodeStatus } from "@/components/react-flow/node-status-indicator";

interface UseNodeStatusOptions<TChannel extends Realtime.ChannelInput> {
  nodeId: string;
  channel: TChannel;
  topic: keyof Realtime.Channel.InferTopics<TChannel> & string;
  refreshToken: () => Promise<Realtime.Subscribe.ClientToken>;
}

export function useNodeStatus<TChannel extends Realtime.ChannelInput>({
  nodeId,
  channel,
  topic,
  refreshToken,
}: UseNodeStatusOptions<TChannel>) {
  const [status, setStatus] = useState<NodeStatus>("initial");

  const { messages } = useRealtime({
    channel,
    topics: [topic],
    token: refreshToken,
    enabled: true,
  });

  useEffect(() => {
    const latestMessage = messages.byTopic[topic];

    if (latestMessage?.kind === "data" && latestMessage.data.nodeId === nodeId) {
      setStatus(latestMessage.data.status as NodeStatus);
    }
  }, [messages.byTopic, topic, nodeId]);

  return status;
}
