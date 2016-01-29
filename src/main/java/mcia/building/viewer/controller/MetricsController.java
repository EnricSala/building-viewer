package mcia.building.viewer.controller;

import java.util.Collections;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import lombok.extern.slf4j.Slf4j;
import mcia.building.viewer.domain.Point;
import mcia.building.viewer.metrics.MetricsRepository;
import rx.Observable;

@RestController
@RequestMapping("/api/metrics")
@Slf4j
public class MetricsController {

	@Autowired
	private MetricsRepository metricsRepository;

	@RequestMapping(value = "/current", method = RequestMethod.POST)
	public Observable<List<Point>> getCurrent(@RequestBody List<String> ids) {
		log.info("GET /metrics/current with {}", ids);
		return metricsRepository
				.queryLastPoint(ids)
				.onErrorReturn(err -> Collections.emptyList());
	}

}
