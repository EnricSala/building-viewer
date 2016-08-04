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

import javax.validation.Valid;

@RestController
@RequestMapping("/api/metrics")
@RequiredArgsConstructor
@Slf4j
public class MetricsController {

	private final MetricsRepository metricsRepository;

	@PostMapping("/current")
	public Observable<CurrentMetricsResponse> currentMetrics(
			@Valid @RequestBody CurrentMetricsRequest request) {

		int count = request.getMetricIds().size();
		log.info("POST /metrics/current to read {} series", count);
		return metricsRepository
				.queryLastPoint(request.getMetricIds())
				.map(CurrentMetricsResponse::new);
	}

}
