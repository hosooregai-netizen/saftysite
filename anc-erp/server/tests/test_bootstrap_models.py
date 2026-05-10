import unittest

from server.app.domain.models import Contact, Organization, ProjectParty
from server.app.repositories.bootstrap_repository import BootstrapRepository


class BootstrapModelShapeTestCase(unittest.TestCase):
    def test_bootstrap_project_uses_project_party_instead_of_string_owner_list(self) -> None:
        project = BootstrapRepository().all()[0]

        self.assertTrue(project.organizations)
        self.assertTrue(project.projectParties)
        self.assertTrue(project.contacts)
        self.assertIsInstance(project.organizations[0], Organization)
        self.assertIsInstance(project.projectParties[0], ProjectParty)
        self.assertIsInstance(project.contacts[0], Contact)
        self.assertEqual(project.projectParties[0].projectId, project.id)
