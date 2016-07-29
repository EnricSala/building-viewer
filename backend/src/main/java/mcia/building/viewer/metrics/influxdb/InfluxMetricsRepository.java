package mcia.building.viewer.metrics.influxdb;

import java.util.List;
import java.util.Map;
import java.util.StringJoiner;
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

	private final InfluxDB influx;
	private final String database;

	public InfluxMetricsRepository(InfluxDB influx, String database) {
		this.influx = influx;
		this.database = database;
	}

	@Override
	public Observable<Map<String, Point>> queryLastPoint(List<String> ids) {
		log.debug("Query last point from {} series", ids.size());
		return buildQuery(ids)
				.doOnNext(query -> log.debug("Influx query: {}", query))
				.map(query -> influx.query(database, query, TimeUnit.MILLISECONDS))
				.flatMapIterable(it -> it)
				.map(this::toSinglePoint)
				.filter(p -> p.getPoint() != null)
				.toMap(NamedPoint::getId, NamedPoint::getPoint);
	}

	private Observable<String> buildQuery(List<String> ids) {
		final String prefix = "select time, value from ";
		final String sufix = " limit 1";
		return Observable
				.from(ids)
				.map(this::cleanMetricId)
				.reduce(new StringJoiner(", ", prefix, sufix), StringJoiner::add)
				.map(StringJoiner::toString);
	}

	private NamedPoint toSinglePoint(Serie serie) {
		NamedPoint point = new NamedPoint(serie.getName(), null);
		serie.getRows().stream().findFirst().ifPresent(row -> {
			long time = ((Double) row.get("time")).longValue();
			double value = (Double) row.get("value");
			point.setPoint(new Point(time, value));
		});
		return point;
	}

	private String cleanMetricId(String id) {
		return id.replaceAll("[^a-zA-Z0-9 \\._-]", "");
	}

}
