package mcia.building.viewer.metrics.influxdb;

import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import org.influxdb.InfluxDB;
import org.influxdb.dto.Serie;

import lombok.extern.slf4j.Slf4j;
import mcia.building.viewer.domain.Point;
import mcia.building.viewer.metrics.MetricsRepository;
import rx.Observable;

@Slf4j
public class InfluxMetricsRepository implements MetricsRepository {

	private final InfluxDB influx;
	private final String database;

	public InfluxMetricsRepository(InfluxDB influx, String database) {
		this.influx = influx;
		this.database = database;
	}

	@Override
	public Observable<List<Point>> queryLastPoint(List<String> ids) {
		log.info("Query last point from: {}", ids);
		return Observable
				.from(ids)
				.map(this::cleanMetricId)
				.map(this::querySerie)
				.map(this::toSinglePoint)
				.toList();
	}

	private Serie querySerie(String id) {
		List<Serie> series = influx.query(database, "select time, value from " + id, TimeUnit.MILLISECONDS);
		return series.get(0);
	}

	private Point toSinglePoint(Serie serie) {
		List<Map<String, Object>> rows = serie.getRows();
		Map<String, Object> first = rows.get(0);
		long time = ((Double) first.get("time")).longValue();
		double value = ((Double) first.get("value")).doubleValue();
		return new Point(serie.getName(), time, value);
	}

	private String cleanMetricId(String id) {
		return id.replaceAll("[;()]", "");
	}

}
