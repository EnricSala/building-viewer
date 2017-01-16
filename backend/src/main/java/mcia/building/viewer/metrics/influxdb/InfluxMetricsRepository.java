package mcia.building.viewer.metrics.influxdb;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import mcia.building.viewer.domain.NamedPoint;
import mcia.building.viewer.domain.Point;
import mcia.building.viewer.metrics.MetricsRepository;
import org.influxdb.InfluxDB;
import org.influxdb.dto.Serie;
import rx.Observable;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.StringJoiner;
import java.util.concurrent.TimeUnit;

@RequiredArgsConstructor
@Slf4j
public class InfluxMetricsRepository implements MetricsRepository {

	private final InfluxDB influx;
	private final String database;

	@Override
	public Observable<Map<String, Point>> queryLastPoint(List<String> ids) {
		log.debug("Query last point from {}", ids);
		if (ids.isEmpty())
			return Observable.just(Collections.emptyMap());
		return buildQuery(ids)
				.doOnNext(query -> log.debug("Influx query: {}", query))
				.map(query -> influx.query(database, query, TimeUnit.MILLISECONDS))
				.flatMapIterable(it -> it)
				.map(this::toSinglePoint)
				.filter(p -> p.getPoint() != null)
				.toMap(NamedPoint::getId, NamedPoint::getPoint);
	}

	private Observable<String> buildQuery(List<String> ids) {
		final String prefix = "select time, value from \"";
		final String sufix = "\" limit 1";
		return Observable
				.from(ids)
				.filter(this::isValidMetricId)
				.map(this::cleanMetricId)
				.filter(this::isValidMetricId)
				.reduce(new StringJoiner("\", \"", prefix, sufix), StringJoiner::add)
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

	private boolean isValidMetricId(String id) {
		return id != null && !id.isEmpty();
	}

}
