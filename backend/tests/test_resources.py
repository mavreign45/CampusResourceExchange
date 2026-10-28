import pytest
from fastapi import status


def test_list_resources_structure(client):
    """Verify GET /api/v1/resources response contract and nested relations."""
    response = client.get("/api/v1/resources")
    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert "page_size" in data
    assert "total_pages" in data

    assert data["total"] == 12
    assert len(data["items"]) == 12

    # Verify first item contains complete relations
    first = data["items"][0]
    assert "id" in first
    assert "name" in first
    assert "category" in first
    assert "location" in first
    assert "custodian" in first
    assert first["category"]["name"] is not None
    assert first["location"]["building"] is not None
    assert first["custodian"]["contact_email"] is not None


def test_search_resources_by_name(client):
    """Test search query parameter matching resource name."""
    response = client.get("/api/v1/resources?search=oscilloscope")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["total"] >= 1
    assert any("oscilloscope" in item["name"].lower() for item in data["items"])


def test_search_resources_by_model_and_department(client):
    """Test search parameter matches model number and department name."""
    # Model search
    res_model = client.get("/api/v1/resources?search=FX3")
    assert res_model.status_code == status.HTTP_200_OK
    assert res_model.json()["total"] == 1
    assert "FX3" in res_model.json()["items"][0]["model_number"]

    # Department search
    res_dept = client.get("/api/v1/resources?search=Bioengineering")
    assert res_dept.status_code == status.HTTP_200_OK
    assert res_dept.json()["total"] >= 1


def test_filter_by_category(client):
    """Test filtering resources by exact category name."""
    response = client.get("/api/v1/resources?category=Laboratory+Equipment")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["total"] == 4
    for item in data["items"]:
        assert item["category"]["name"] == "Laboratory Equipment"


def test_filter_by_availability(client):
    """Test filtering by availability status."""
    res_avail = client.get("/api/v1/resources?availability=available")
    assert res_avail.status_code == status.HTTP_200_OK
    assert all(item["availability_status"] == "available" for item in res_avail.json()["items"])

    res_use = client.get("/api/v1/resources?availability=in_use")
    assert res_use.status_code == status.HTTP_200_OK
    assert all(item["availability_status"] == "in_use" for item in res_use.json()["items"])

    res_maint = client.get("/api/v1/resources?availability=maintenance")
    assert res_maint.status_code == status.HTTP_200_OK
    assert all(item["availability_status"] == "maintenance" for item in res_maint.json()["items"])


def test_filter_by_building(client):
    """Test filtering by location building."""
    response = client.get("/api/v1/resources?building=Turing+Engineering+Hall")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["total"] >= 2
    for item in data["items"]:
        assert item["location"]["building"] == "Turing Engineering Hall"


def test_combined_filters(client):
    """Test multiple filters operating simultaneously."""
    response = client.get(
        "/api/v1/resources?category=Laboratory+Equipment&availability=available&building=Turing+Engineering+Hall"
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["total"] >= 1
    for item in data["items"]:
        assert item["category"]["name"] == "Laboratory Equipment"
        assert item["availability_status"] == "available"
        assert item["location"]["building"] == "Turing Engineering Hall"


def test_sorting(client):
    """Test sorting by name ascending and descending."""
    res_asc = client.get("/api/v1/resources?sort_by=name&sort_order=asc")
    assert res_asc.status_code == status.HTTP_200_OK
    names_asc = [r["name"] for r in res_asc.json()["items"]]
    assert names_asc == sorted(names_asc)

    res_desc = client.get("/api/v1/resources?sort_by=name&sort_order=desc")
    assert res_desc.status_code == status.HTTP_200_OK
    names_desc = [r["name"] for r in res_desc.json()["items"]]
    assert names_desc == sorted(names_desc, reverse=True)


def test_pagination(client):
    """Test page and page_size pagination controls."""
    res_p1 = client.get("/api/v1/resources?page=1&page_size=4")
    assert res_p1.status_code == status.HTTP_200_OK
    data_p1 = res_p1.json()
    assert len(data_p1["items"]) == 4
    assert data_p1["total"] == 12
    assert data_p1["total_pages"] == 3
    assert data_p1["page"] == 1

    res_p2 = client.get("/api/v1/resources?page=2&page_size=4")
    assert res_p2.status_code == status.HTTP_200_OK
    data_p2 = res_p2.json()
    assert len(data_p2["items"]) == 4
    assert data_p2["page"] == 2

    # Verify no item overlap between pages
    ids_p1 = {item["id"] for item in data_p1["items"]}
    ids_p2 = {item["id"] for item in data_p2["items"]}
    assert ids_p1.isdisjoint(ids_p2)


def test_get_resource_details(client):
    """Test GET /api/v1/resources/{id} returns full resource specifications."""
    response = client.get("/api/v1/resources/res-osc-01")
    assert response.status_code == status.HTTP_200_OK

    res = response.json()
    assert res["id"] == "res-osc-01"
    assert "Digital Storage Oscilloscope" in res["name"]
    assert res["category"]["name"] == "Laboratory Equipment"
    assert res["location"]["building"] == "Turing Engineering Hall"
    assert res["custodian"]["name"] == "Dr. Marcus Vance"
    assert len(res["specifications"]) > 0
    assert len(res["accessories_included"]) > 0
    assert len(res["usage_guidelines"]) > 0


def test_get_missing_resource_returns_404(client):
    """Test requesting a nonexistent resource ID returns HTTP 404."""
    response = client.get("/api/v1/resources/nonexistent-item-999")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "not found" in response.json()["detail"].lower()


def test_resource_summary_route(client):
    """
    Test GET /api/v1/resources/summary.
    Also verifies route ordering: ensures '/summary' is not captured by '/{id}'.
    """
    response = client.get("/api/v1/resources/summary")
    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert "total_resources" in data
    assert "available_now" in data
    assert "category_count" in data
    assert "requires_verification" in data

    assert data["total_resources"] == 12
    assert data["available_now"] == 9
    assert data["category_count"] == 5
    assert data["requires_verification"] == 6


def test_invalid_query_parameters_validation(client):
    """Test validation errors for invalid query parameters."""
    # Invalid sort_by field
    res_bad_sort = client.get("/api/v1/resources?sort_by=unsupported_column")
    assert res_bad_sort.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    # Invalid page number (< 1)
    res_bad_page = client.get("/api/v1/resources?page=0")
    assert res_bad_page.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    # Invalid page_size (> 100)
    res_bad_size = client.get("/api/v1/resources?page_size=200")
    assert res_bad_size.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
