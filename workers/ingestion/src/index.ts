export default {
  scheduled(controller: ScheduledController): void {
    console.log(
      JSON.stringify({
        message: 'M0 ingestion schedule checked with all connectors disabled',
        scheduled_time: controller.scheduledTime,
      }),
    );
  },
} satisfies ExportedHandler;
