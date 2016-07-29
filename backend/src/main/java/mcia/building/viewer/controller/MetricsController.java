package mcia.building.viewer.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import mcia.building.viewer.controller.dto.CurrentMetricsRequest;
import mcia.building.viewer.controller.dto.CurrentMetricsResponse;
import mcia.building.viewer.metrics.MetricsRepository;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import rx.Observable;

@RestController
@RequestMapping("/api/metrics")
@RequiredArgsConstructor
@Slf4j
public class MetricsController {

	private final MetricsRepository metricsRepository;

	@PostMapping("/current")
	public Observable<CurrentMetricsResponse> currentMetrics(
			@RequestBody CurrentMetricsRequest request) {

		log.info("POST /metrics/current to read {}", request);
		return metricsRepository
				.queryLastPoint(request.getMetricIds())
				.map(CurrentMetricsResponse::new);
	}

}
