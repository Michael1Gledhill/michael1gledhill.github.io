import pytest
import requests


def test_invalid_credentials(mocker):
    mock_response = mocker.Mock()
    mock_response.status_code = 401
    mock_response.text = ""

    mock_post = mocker.patch("requests.post", return_value=mock_response)

    response = requests.post(
        "http://example.com/login",
        data={"username": "admin", "password": "admin"}
    )

    assert response.status_code == 401
    assert response.text.strip() == ""
    mock_post.assert_called_once()


def test_valid_credentials(mocker):
    mock_response = mocker.Mock()
    mock_response.status_code = 200
    mock_response.text = ""

    mock_post = mocker.patch("requests.post", return_value=mock_response)

    response = requests.post(
        "http://example.com/login",
        data={"username": "admin", "password": "qwerty"}
    )

    assert response.status_code == 200
    assert response.text.strip() == ""
    mock_post.assert_called_once()