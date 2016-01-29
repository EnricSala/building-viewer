package mcia.building.viewer.metrics;

import java.util.List;

import mcia.building.viewer.domain.Point;
import rx.Observable;

public interface MetricsRepository {

	public Observable<List<Point>> queryLastPoint(List<String> ids);

}
