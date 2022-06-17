import { IncomingRequest, KafkaContext, KafkaHeaders, ReadPacket, ServerKafka } from "@nestjs/microservices";
import { EachMessagePayload, KafkaMessage } from "@nestjs/microservices/external/kafka.interface";
import { NO_MESSAGE_HANDLER } from "@nestjs/microservices/constants";
import { Observable } from "rxjs";
import { IncomingMessage } from "http";

export default class KafkaCustomerTransporter extends ServerKafka {
  public async handleMessage(payload: EachMessagePayload) {
    const channel = payload.topic;
    const rawMessage = this.parser.parse<KafkaMessage>(
      Object.assign(payload.message, {
        topic: payload.topic,
        partition: payload.partition,
      })
    );
    const headers = rawMessage.headers as unknown as Record<string, any>;
    const correlationId = headers[KafkaHeaders.CORRELATION_ID];
    const replyTopic = headers[KafkaHeaders.REPLY_TOPIC];
    const replyPartition = headers[KafkaHeaders.REPLY_PARTITION];

    const packet = this.deserializer.deserialize(rawMessage, { channel }) as ReadPacket;
    const kafkaContext = new KafkaContext([rawMessage, payload.partition, payload.topic]);
    // if the correlation id or reply topic is not set
    // then this is an event (events could still have correlation id)
    if (!correlationId || !replyTopic) {
      const result = this.handleEvent(packet.pattern, packet, kafkaContext);
      const commitMessage = {
        topic: payload.topic,
        partition: payload.partition,
        offset: (parseInt(rawMessage.offset) + 1).toString(),
      };
      await this.consumer.commitOffsets([commitMessage]);
      return result;
    }

    const publish = this.getPublisher(replyTopic, replyPartition, correlationId);
    const handler = this.getHandlerByPattern(packet.pattern);
    if (!handler) {
      return publish({
        id: correlationId,
        err: NO_MESSAGE_HANDLER,
      });
    }

    const response$ = this.transformToObservable(await handler(packet.data, kafkaContext)) as Observable<any>;
    response$ && this.send(response$, publish);
    const commitMessage = {
      topic: payload.topic,
      partition: payload.partition,
      offset: (parseInt(rawMessage.offset) + 1).toString(),
    };

    await this.consumer.commitOffsets([commitMessage]);
  }
}
