package mcia.building.viewer.metrics.influxdb;

import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import org.influxdb.InfluxDB;
import org.influxdb.dto.Serie;

import lombok.extern.slf4j.Slf4j;
import mcia.building.viewer.domain.NamedPoint;
import mcia.building.viewer.domain.Point;
import mcia.building.viewer.metrics.MetricsRepository;
import rx.Observable;

@Slf4j
public class InfluxMetricsRepository implements MetricsRepository {

	private static final String singleQuery = "select time, value from \"%s\"";

	private final InfluxDB influx;
	private final String database;

	public InfluxMetricsRepository(InfluxDB influx, String database) {
		this.influx = influx;
		this.database = database;
	}

	@Override
	public Observable<Map<String, Point>> queryLastPoint(List<String> ids) {
		log.debug("Query last point from: {}", ids);
		return Observable
				.from(ids)
				.map(this::cleanMetricId)
				.flatMap(this::querySerie)
				.map(this::toSinglePoint)
				.filter(p -> p.getPoint() != null)
				.toMap(NamedPoint::getId, NamedPoint::getPoint);
	}

	private Observable<Serie> querySerie(String serieId) {
		return Observable
				.just(serieId)
				.map(id -> String.format(singleQuery, id))
				.map(q -> influx.query(database, q, TimeUnit.MILLISECONDS))
				.flatMap(Observable::from)
				.first()
				.onErrorResumeNext(Observable.empty());
	}

	private NamedPoint toSinglePoint(Serie serie) {
		NamedPoint point = new NamedPoint(serie.getName(), null);
		serie.getRows().stream().findFirst().ifPresent(row -> {
			long time = ((Double) row.get("time")).longValue();
			double value = ((Double) row.get("value")).doubleValue();
			point.setPoint(new Point(time, value));
		});
		return point;
	}

	private String cleanMetricId(String id) {
		return id.replaceAll("[^a-zA-Z0-9 \\._-]", "");
	}

}
