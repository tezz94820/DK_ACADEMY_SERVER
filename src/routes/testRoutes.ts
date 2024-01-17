import express from 'express';
import { OptionWithUserInteraction, getQuestionStates, getSelectedOptionByQuestionNumber, getTestAnswersAnalysis, getTestAttemptRegistry, getTestDetailsById, getTestListTypeWise, getTestQuestion, getTestResult, getTestSolution, getTestStartDetailsById, getTestSummary  } from '../controllers/test';
import { Protect } from '../middlewares/auth';
import { validateAsSchema } from '../middlewares/validation';
import { OptionWithUserInteractionSchema } from '../validations/tests';

const router = express.Router();

router.get('/test-list', getTestListTypeWise)
router.get('/test-details/:id', getTestDetailsById);
router.get('/test-attempt-registry/:test_id', Protect, getTestAttemptRegistry)
router.get('/test-start/:id', getTestStartDetailsById);
router.get('/test/question/:test_id/:question_number', getTestQuestion);
router.get('/test/selected-option-by-question/:test_attempt_id/:question_number', Protect, getSelectedOptionByQuestionNumber);
router.post('/test/option-user-interaction', Protect, validateAsSchema(OptionWithUserInteractionSchema), OptionWithUserInteraction);
router.get('/test/question-states/:test_attempt_id',Protect, getQuestionStates);
router.get('/test/test-summary/:test_attempt_id', Protect, getTestSummary);
router.get('/test/test-result/:test_attempt_id', Protect, getTestResult);
router.get('/test/test-result/answers/:test_attempt_id', Protect, getTestAnswersAnalysis);
router.get('/test/test-solutions/:test_id', Protect, getTestSolution);
export default router;