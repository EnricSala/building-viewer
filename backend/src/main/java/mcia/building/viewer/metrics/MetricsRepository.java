package mcia.building.viewer.metrics;

import java.util.List;
import java.util.Map;

import mcia.building.viewer.domain.Point;
import rx.Observable;

public interface MetricsRepository {

	Observable<Map<String, Point>> queryLastPoint(List<String> ids);

}
