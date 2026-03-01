"""Unit tests for the Haversine distance function."""

import os
os.environ["SUPABASE_URL"] = "https://example.supabase.co"
os.environ["SUPABASE_KEY"] = "dummy-key"

from src.main import _haversine_distance


def test_haversine_identical_points_returns_zero():
    """Distance between a point and itself should be 0."""
    assert _haversine_distance(51.3758, -2.3599, 51.3758, -2.3599) == 0.0


def test_haversine_known_distance_bath_to_bristol():
    """Bath (51.3758, -2.3599) to Bristol (51.4545, -2.5879) is ~18 km."""
    dist = _haversine_distance(51.3758, -2.3599, 51.4545, -2.5879)
    assert 17_000 < dist < 19_000, f"Expected ~18km, got {dist:.0f}m"


def test_haversine_short_distance():
    """Two points ~25m apart on Bath campus."""
    # Approx 25m apart
    dist = _haversine_distance(51.3758, -2.3599, 51.3760, -2.3599)
    assert 20 < dist < 30, f"Expected ~25m, got {dist:.1f}m"


def test_haversine_symmetry():
    """Distance A→B should equal distance B→A."""
    d1 = _haversine_distance(51.3758, -2.3599, 51.5074, -0.1278)
    d2 = _haversine_distance(51.5074, -0.1278, 51.3758, -2.3599)
    assert abs(d1 - d2) < 0.01, f"Asymmetric: {d1} vs {d2}"


def test_haversine_equator_crossing():
    """Distance across the equator (0,0) to (1,0) is ~111 km."""
    dist = _haversine_distance(0, 0, 1, 0)
    assert 110_000 < dist < 112_000, f"Expected ~111km, got {dist:.0f}m"
