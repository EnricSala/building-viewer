package mcia.building.viewer.controller;

import java.util.Collections;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import lombok.extern.slf4j.Slf4j;
import mcia.building.viewer.controller.dto.CurrentMetricsRequest;
import mcia.building.viewer.controller.dto.CurrentMetricsResponse;
import mcia.building.viewer.metrics.MetricsRepository;
import rx.Observable;

@RestController
@RequestMapping("/api/metrics")
@Slf4j
public class MetricsController {

	@Autowired
	private MetricsRepository metricsRepository;

	@RequestMapping(value = "/current", method = RequestMethod.POST)
	public Observable<CurrentMetricsResponse> getCurrent(@RequestBody CurrentMetricsRequest request) {
		log.info("GET /metrics/current with {}", request);
		return metricsRepository
				.queryLastPoint(request.getMetricIds())
				.onErrorReturn(err -> {
					log.error("Error reading current metrics", err);
					return Collections.emptyMap();
				})
				.map(CurrentMetricsResponse::new);
	}

}
